from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import (
    Assessment, AssessmentScore, GradingScale, Student, ClassLevel, Subject, Term
)
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

assessments_bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")

def calculate_grade_and_remark(score_val):
    """
    Evaluates score against configurable grading scale in DB.
    """
    scale = GradingScale.query.order_by(GradingScale.order_rank.asc()).all()
    for item in scale:
        if item.min_score <= score_val <= item.max_score:
            return item.grade, item.remark
    return "9", "Fail"

@assessments_bp.route("", methods=["GET"])
@jwt_required()
def list_assessments():
    term_id = request.args.get("term_id", type=int)
    class_id = request.args.get("class_id", type=int)
    stream_id = request.args.get("stream_id", type=int)
    subject_id = request.args.get("subject_id", type=int)

    query = Assessment.query
    if term_id:
        query = query.filter_by(term_id=term_id)
    if class_id:
        query = query.filter_by(class_level_id=class_id)
    if stream_id:
        query = query.filter_by(stream_id=stream_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)

    assessments = query.order_by(Assessment.created_at.desc()).all()
    return jsonify({"assessments": [a.to_dict() for a in assessments]}), 200

@assessments_bp.route("", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def create_assessment():
    current_user = get_current_user()
    data = request.get_json() or {}

    term_id = data.get("term_id")
    class_level_id = data.get("class_level_id")
    stream_id = data.get("stream_id")
    subject_id = data.get("subject_id")
    name = data.get("name", "").strip()
    assessment_type = data.get("assessment_type", "CLASS_SCORE") # CLASS_SCORE or EXAM
    max_marks = float(data.get("max_marks", 100.0))
    weight_percentage = float(data.get("weight_percentage", 30.0 if assessment_type == "CLASS_SCORE" else 70.0))

    if not term_id or not class_level_id or not subject_id or not name:
        return jsonify({"error": "Term, Class, Subject, and Assessment name are required"}), 400

    ass = Assessment(
        term_id=term_id,
        class_level_id=class_level_id,
        stream_id=stream_id,
        subject_id=subject_id,
        name=name,
        assessment_type=assessment_type,
        max_marks=max_marks,
        weight_percentage=weight_percentage,
        created_by_id=current_user.id
    )
    db.session.add(ass)
    db.session.commit()
    log_audit_action(current_user.id, "ASSESSMENT_CREATE", "ACADEMICS", f"Created assessment {name} for class {class_level_id}")

    return jsonify({"message": "Assessment created successfully", "assessment": ass.to_dict()}), 201

@assessments_bp.route("/<int:assessment_id>/scores", methods=["GET"])
@jwt_required()
def get_assessment_scores(assessment_id):
    current_user = get_current_user()
    assessment = Assessment.query.get_or_404(assessment_id)

    # Students enrolled in this class
    st_query = Student.query.filter_by(current_class_id=assessment.class_level_id, status="ACTIVE")
    if assessment.stream_id:
        st_query = st_query.filter_by(current_stream_id=assessment.stream_id)
    students = st_query.order_by(Student.last_name.asc()).all()

    existing_scores = {s.student_id: s for s in assessment.scores}

    # If student or parent, restrict
    if current_user and current_user.role and current_user.role.name == "student":
        students = [s for s in students if s.user_id == current_user.id]
    elif current_user and current_user.role and current_user.role.name == "parent":
        if current_user.guardian_profile:
            child_ids = [sg.student_id for sg in current_user.guardian_profile.students]
            students = [s for s in students if s.id in child_ids]

    res = []
    for s in students:
        sc = existing_scores.get(s.id)
        raw_val = sc.raw_score if sc else None
        grade, remark = calculate_grade_and_remark(raw_val) if raw_val is not None else ("-", "-")
        res.append({
            "student_id": s.id,
            "admission_number": s.admission_number,
            "student_name": s.full_name,
            "raw_score": raw_val,
            "weighted_score": sc.weighted_score if sc else None,
            "grade": grade,
            "remarks": sc.remarks if sc else remark,
            "score_id": sc.id if sc else None
        })

    return jsonify({
        "assessment": assessment.to_dict(),
        "scores": res
    }), 200

@assessments_bp.route("/<int:assessment_id>/scores", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def save_assessment_scores(assessment_id):
    current_user = get_current_user()
    assessment = Assessment.query.get_or_404(assessment_id)

    if assessment.is_locked:
        return jsonify({"error": "This assessment has been locked against changes"}), 403

    data = request.get_json() or {}
    scores_data = data.get("scores", []) # list of {student_id, raw_score, remarks}

    updated_count = 0
    for item in scores_data:
        st_id = item.get("student_id")
        raw_val = item.get("raw_score")
        if raw_val is None or raw_val == "":
            continue
        raw_val = float(raw_val)
        weighted_val = round((raw_val / assessment.max_marks) * assessment.weight_percentage, 2)
        grade, default_remark = calculate_grade_and_remark(raw_val)
        remark = item.get("remarks") or default_remark

        sc = AssessmentScore.query.filter_by(assessment_id=assessment.id, student_id=st_id).first()
        if sc:
            sc.raw_score = raw_val
            sc.weighted_score = weighted_val
            sc.remarks = remark
        else:
            sc = AssessmentScore(
                assessment_id=assessment.id,
                student_id=st_id,
                raw_score=raw_val,
                weighted_score=weighted_val,
                remarks=remark
            )
            db.session.add(sc)
        updated_count += 1

    db.session.commit()
    log_audit_action(current_user.id, "MARKS_RECORD", "ACADEMICS", f"Recorded scores for {updated_count} students in {assessment.name}")

    return jsonify({"message": f"Saved {updated_count} student marks successfully"}), 200

@assessments_bp.route("/<int:assessment_id>/toggle-lock", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def toggle_assessment_lock(assessment_id):
    current_user = get_current_user()
    assessment = Assessment.query.get_or_404(assessment_id)
    assessment.is_locked = not assessment.is_locked
    db.session.commit()
    status_str = "locked" if assessment.is_locked else "unlocked"
    log_audit_action(current_user.id, "ASSESSMENT_LOCK_TOGGLE", "ACADEMICS", f"{status_str.capitalize()} assessment {assessment.name}")

    return jsonify({"message": f"Assessment is now {status_str}", "is_locked": assessment.is_locked}), 200

# Grading Scale Management
@assessments_bp.route("/grading-scale", methods=["GET"])
@jwt_required()
def get_grading_scale():
    scales = GradingScale.query.order_by(GradingScale.order_rank.asc()).all()
    return jsonify({"grading_scale": [s.to_dict() for s in scales]}), 200

@assessments_bp.route("/grading-scale", methods=["PUT"])
@jwt_required()
@role_required("super_admin")
def update_grading_scale():
    current_user = get_current_user()
    data = request.get_json() or {}
    items = data.get("grading_scale", [])

    for itm in items:
        gid = itm.get("id")
        scale_obj = GradingScale.query.get(gid)
        if scale_obj:
            scale_obj.grade = itm.get("grade", scale_obj.grade)
            scale_obj.min_score = float(itm.get("min_score", scale_obj.min_score))
            scale_obj.max_score = float(itm.get("max_score", scale_obj.max_score))
            scale_obj.remark = itm.get("remark", scale_obj.remark)
            scale_obj.grade_point = float(itm.get("grade_point", scale_obj.grade_point))

    db.session.commit()
    log_audit_action(current_user.id, "GRADING_SCALE_UPDATE", "ACADEMICS", "Updated school grading scale boundaries")

    return jsonify({"message": "Grading scale updated successfully"}), 200
