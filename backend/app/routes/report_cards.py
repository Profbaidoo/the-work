import io
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from backend.app.models.base import db
from backend.app.models import (
    ReportCard, Student, AcademicYear, Term, ClassLevel, Stream,
    Assessment, AssessmentScore, Attendance, SchoolSetting, GradingScale
)
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.pdf_generator import generate_report_card_pdf
from backend.app.utils.audit import log_audit_action

report_cards_bp = Blueprint("report_cards", __name__, url_prefix="/api/report-cards")

def evaluate_grade(score):
    scales = GradingScale.query.order_by(GradingScale.order_rank.asc()).all()
    for s in scales:
        if s.min_score <= score <= s.max_score:
            return s.grade, s.remark
    return "9", "Fail"

@report_cards_bp.route("", methods=["GET"])
@jwt_required()
def list_report_cards():
    current_user = get_current_user()
    term_id = request.args.get("term_id", type=int)
    class_id = request.args.get("class_id", type=int)
    stream_id = request.args.get("stream_id", type=int)
    student_id = request.args.get("student_id", type=int)

    query = ReportCard.query

    # Student portal access restriction
    if current_user and current_user.role and current_user.role.name == "student":
        if current_user.student_profile:
            query = query.filter(ReportCard.student_id == current_user.student_profile.id, ReportCard.is_published == True)
        else:
            return jsonify({"report_cards": []}), 200

    # Parent portal access restriction
    if current_user and current_user.role and current_user.role.name == "parent":
        if current_user.guardian_profile:
            child_ids = [sg.student_id for sg in current_user.guardian_profile.students]
            query = query.filter(ReportCard.student_id.in_(child_ids), ReportCard.is_published == True)
        else:
            return jsonify({"report_cards": []}), 200

    if term_id:
        query = query.filter(ReportCard.term_id == term_id)
    if class_id:
        query = query.filter(ReportCard.class_level_id == class_id)
    if stream_id:
        query = query.filter(ReportCard.stream_id == stream_id)
    if student_id:
        query = query.filter(ReportCard.student_id == student_id)

    cards = query.order_by(ReportCard.class_position.asc().nullslast()).all()
    return jsonify({"report_cards": [c.to_dict() for c in cards]}), 200

@report_cards_bp.route("/generate-class", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def generate_class_report_cards():
    """
    Computes terminal totals, subject averages, attendance, and positions for an entire class.
    """
    current_user = get_current_user()
    data = request.get_json() or {}
    term_id = data.get("term_id")
    class_id = data.get("class_id")
    stream_id = data.get("stream_id")

    if not term_id or not class_id:
        return jsonify({"error": "term_id and class_id are required"}), 400

    term = Term.query.get_or_404(term_id)
    st_query = Student.query.filter_by(current_class_id=class_id, status="ACTIVE")
    if stream_id:
        st_query = st_query.filter_by(current_stream_id=stream_id)
    students = st_query.all()
    total_students_count = len(students)

    generated_cards = []
    student_averages = []

    for st in students:
        # Calculate attendance in term
        att_present = Attendance.query.filter(
            Attendance.student_id == st.id,
            Attendance.date >= term.start_date,
            Attendance.date <= term.end_date,
            Attendance.status.in_(["PRESENT", "LATE"])
        ).count()
        att_total = Attendance.query.filter(
            Attendance.student_id == st.id,
            Attendance.date >= term.start_date,
            Attendance.date <= term.end_date
        ).count()

        # Find all assessment scores for student in this term
        scores = db.session.query(AssessmentScore, Assessment)\
            .join(Assessment, Assessment.id == AssessmentScore.assessment_id)\
            .filter(Assessment.term_id == term_id, AssessmentScore.student_id == st.id).all()

        tot_score = sum(sc.AssessmentScore.weighted_score or 0.0 for sc in scores)
        avg_score = (tot_score / len(scores)) if scores else 0.0
        ov_grade, _ = evaluate_grade(avg_score)

        rc = ReportCard.query.filter_by(student_id=st.id, term_id=term_id).first()
        if not rc:
            rc = ReportCard(
                student_id=st.id,
                academic_year_id=term.academic_year_id,
                term_id=term_id,
                class_level_id=class_id,
                stream_id=st.current_stream_id,
                total_marks=round(tot_score, 1),
                average_score=round(avg_score, 1),
                overall_grade=ov_grade,
                attendance_present=att_present,
                attendance_total_days=att_total if att_total > 0 else 60,
                total_students_in_class=total_students_count,
                class_teacher_remarks="Satisfactory progress shown throughout the term.",
                headteacher_remarks="Good terminal performance. Keep up the high standards.",
                promotion_status="Promoted" if avg_score >= 50 else "Repeat"
            )
            db.session.add(rc)
        else:
            rc.total_marks = round(tot_score, 1)
            rc.average_score = round(avg_score, 1)
            rc.overall_grade = ov_grade
            rc.attendance_present = att_present
            rc.attendance_total_days = att_total if att_total > 0 else 60
            rc.total_students_in_class = total_students_count

        db.session.flush()
        student_averages.append((rc, avg_score))

    # Calculate class positions (1st, 2nd, 3rd, etc.)
    student_averages.sort(key=lambda x: x[1], reverse=True)
    for pos, (rc_obj, _) in enumerate(student_averages, start=1):
        rc_obj.class_position = pos
        generated_cards.append(rc_obj)

    db.session.commit()
    log_audit_action(current_user.id, "REPORT_CARD_GENERATE", "ACADEMICS", f"Generated {len(generated_cards)} report cards for class {class_id}")

    return jsonify({
        "message": f"Successfully generated report cards for {len(generated_cards)} students",
        "cards_count": len(generated_cards)
    }), 200

@report_cards_bp.route("/<int:report_card_id>", methods=["PUT"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def update_report_card(report_card_id):
    current_user = get_current_user()
    rc = ReportCard.query.get_or_404(report_card_id)

    if rc.is_locked and current_user.role.name not in ["super_admin", "headteacher"]:
        return jsonify({"error": "Report card is locked and cannot be edited"}), 403

    data = request.get_json() or {}
    if "class_teacher_remarks" in data:
        rc.class_teacher_remarks = data["class_teacher_remarks"]
    if "headteacher_remarks" in data:
        rc.headteacher_remarks = data["headteacher_remarks"]
    if "promotion_status" in data:
        rc.promotion_status = data["promotion_status"]

    db.session.commit()
    return jsonify({"message": "Report card remarks updated", "report_card": rc.to_dict()}), 200

@report_cards_bp.route("/<int:report_card_id>/publish", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def publish_report_card(report_card_id):
    current_user = get_current_user()
    rc = ReportCard.query.get_or_404(report_card_id)
    rc.is_approved = True
    rc.is_published = True
    rc.is_locked = True
    rc.approved_by_id = current_user.id
    rc.published_at = datetime.utcnow()
    db.session.commit()
    log_audit_action(current_user.id, "REPORT_CARD_PUBLISH", "ACADEMICS", f"Approved and published report card #{rc.id}")

    return jsonify({"message": "Report card approved and published", "report_card": rc.to_dict()}), 200

@report_cards_bp.route("/<int:report_card_id>/pdf", methods=["GET"])
@jwt_required()
def download_report_card_pdf(report_card_id):
    rc = ReportCard.query.get_or_404(report_card_id)
    school = SchoolSetting.query.first()

    school_info = {
        "name": school.school_name if school else "Achimota Royal Basic Academy",
        "motto": school.school_motto if school else "Knowledge, Discipline, and Excellence",
        "address": school.address if school else "P.O. Box AC 48, Achimota - Accra, Ghana",
        "phone": school.phone if school else "+233 24 412 3456"
    }

    student_info = {
        "full_name": rc.student.full_name,
        "admission_number": rc.student.admission_number,
        "class_name": rc.class_level.name if rc.class_level else "",
        "stream_name": rc.stream.name if rc.stream else "",
        "gender": rc.student.gender
    }

    term_info = {
        "term_name": rc.term.name if rc.term else "Term",
        "academic_year": rc.academic_year.name if rc.academic_year else "2025/2026",
        "next_term_begins": "12th May, 2026"
    }

    # Fetch subject breakdowns for student
    scores_query = db.session.query(AssessmentScore, Assessment)\
        .join(Assessment, Assessment.id == AssessmentScore.assessment_id)\
        .filter(Assessment.term_id == rc.term_id, AssessmentScore.student_id == rc.student_id).all()

    # Group scores by subject
    subjects_map = {}
    for sc, ass in scores_query:
        sub_name = ass.subject.name if ass.subject else "General"
        if sub_name not in subjects_map:
            subjects_map[sub_name] = {"class_score": 0.0, "exam_score": 0.0, "total": 0.0, "remarks": sc.remarks or "Good"}
        if ass.assessment_type == "CLASS_SCORE":
            subjects_map[sub_name]["class_score"] += sc.weighted_score or 0.0
        else:
            subjects_map[sub_name]["exam_score"] += sc.weighted_score or 0.0

    academic_scores = []
    for sname, sdata in subjects_map.items():
        tot = sdata["class_score"] + sdata["exam_score"]
        grd, rmk = evaluate_grade(tot)
        academic_scores.append({
            "subject": sname,
            "class_score": sdata["class_score"],
            "exam_score": sdata["exam_score"],
            "total_score": tot,
            "grade": grd,
            "remarks": rmk
        })

    # If no recorded assessments yet, show standard subjects with default baseline
    if not academic_scores:
        for sname in ["English Language", "Mathematics", "Integrated Science", "Social Studies", "Computing / ICT"]:
            grd, rmk = evaluate_grade(rc.average_score)
            academic_scores.append({
                "subject": sname,
                "class_score": rc.average_score * 0.3,
                "exam_score": rc.average_score * 0.7,
                "total_score": rc.average_score,
                "grade": grd,
                "remarks": rmk
            })

    summary_info = {
        "total_marks": rc.total_marks,
        "average": rc.average_score,
        "overall_grade": rc.overall_grade or "1",
        "position": rc.class_position or 1,
        "total_students": rc.total_students_in_class or 1,
        "attendance_present": rc.attendance_present,
        "attendance_total": rc.attendance_total_days,
        "class_teacher_remarks": rc.class_teacher_remarks,
        "headteacher_remarks": rc.headteacher_remarks,
        "promotion_status": rc.promotion_status or "Promoted"
    }

    pdf_bytes = generate_report_card_pdf(school_info, student_info, term_info, academic_scores, summary_info)
    mem = io.BytesIO(pdf_bytes)
    mem.seek(0)

    filename = f"report_card_{rc.student.admission_number.replace('/', '_')}_{rc.term.name.replace(' ', '_')}.pdf"
    return send_file(mem, mimetype="application/pdf", as_attachment=True, download_name=filename)
