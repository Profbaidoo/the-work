from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import (
    ClassLevel, Stream, Subject, ClassSubject, TeacherAssignment,
    AcademicYear, Term, Teacher
)
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

academics_bp = Blueprint("academics", __name__, url_prefix="/api/academics")

# Classes & Streams
@academics_bp.route("/classes", methods=["GET"])
@jwt_required()
def list_classes():
    classes = ClassLevel.query.order_by(ClassLevel.order_index.asc()).all()
    return jsonify({"classes": [c.to_dict() for c in classes]}), 200

@academics_bp.route("/classes", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_class():
    current_user = get_current_user()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    level_group = data.get("level_group", "PRIMARY").strip().upper()
    capacity = data.get("capacity", 40)
    order_index = data.get("order_index", 0)

    if not name or not code:
        return jsonify({"error": "Class name and code are required"}), 400

    if ClassLevel.query.filter((ClassLevel.name == name) | (ClassLevel.code == code)).first():
        return jsonify({"error": "Class name or code already exists"}), 400

    cl = ClassLevel(name=name, code=code, level_group=level_group, capacity=capacity, order_index=order_index)
    db.session.add(cl)
    db.session.commit()
    log_audit_action(current_user.id, "CLASS_CREATE", "ACADEMICS", f"Created class {name} ({code})")

    return jsonify({"message": "Class created successfully", "class": cl.to_dict()}), 201

@academics_bp.route("/streams", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_stream():
    current_user = get_current_user()
    data = request.get_json() or {}
    class_level_id = data.get("class_level_id")
    name = data.get("name", "").strip()
    class_teacher_id = data.get("class_teacher_id")

    if not class_level_id or not name:
        return jsonify({"error": "Class ID and Stream name are required"}), 400

    stream = Stream(class_level_id=class_level_id, name=name, class_teacher_id=class_teacher_id)
    db.session.add(stream)
    db.session.commit()
    log_audit_action(current_user.id, "STREAM_CREATE", "ACADEMICS", f"Created stream {name} for class {class_level_id}")

    return jsonify({"message": "Stream created successfully", "stream": stream.to_dict()}), 201

# Subjects
@academics_bp.route("/subjects", methods=["GET"])
@jwt_required()
def list_subjects():
    subjects = Subject.query.order_by(Subject.name.asc()).all()
    return jsonify({"subjects": [s.to_dict() for s in subjects]}), 200

@academics_bp.route("/subjects", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_subject():
    current_user = get_current_user()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip().upper()
    category = data.get("category", "CORE")
    level_group = data.get("level_group", "ALL")
    description = data.get("description")

    if not name or not code:
        return jsonify({"error": "Subject name and code are required"}), 400

    sub = Subject(name=name, code=code, category=category, level_group=level_group, description=description)
    db.session.add(sub)
    db.session.commit()
    log_audit_action(current_user.id, "SUBJECT_CREATE", "ACADEMICS", f"Created subject {name} ({code})")

    return jsonify({"message": "Subject created successfully", "subject": sub.to_dict()}), 201

# Teacher Assignments
@academics_bp.route("/teacher-assignments", methods=["GET"])
@jwt_required()
def list_teacher_assignments():
    teacher_id = request.args.get("teacher_id", type=int)
    class_id = request.args.get("class_id", type=int)
    year_id = request.args.get("year_id", type=int)

    query = TeacherAssignment.query
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if class_id:
        query = query.filter_by(class_level_id=class_id)
    if year_id:
        query = query.filter_by(academic_year_id=year_id)

    assignments = query.all()
    return jsonify({"assignments": [a.to_dict() for a in assignments]}), 200

@academics_bp.route("/teacher-assignments", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_teacher_assignment():
    current_user = get_current_user()
    data = request.get_json() or {}
    teacher_id = data.get("teacher_id")
    class_level_id = data.get("class_level_id")
    stream_id = data.get("stream_id")
    subject_id = data.get("subject_id")
    academic_year_id = data.get("academic_year_id")

    if not teacher_id or not class_level_id or not subject_id or not academic_year_id:
        return jsonify({"error": "Teacher, Class, Subject, and Academic Year are required"}), 400

    ta = TeacherAssignment(
        teacher_id=teacher_id,
        class_level_id=class_level_id,
        stream_id=stream_id,
        subject_id=subject_id,
        academic_year_id=academic_year_id
    )
    db.session.add(ta)
    db.session.commit()
    log_audit_action(current_user.id, "TEACHER_ASSIGNMENT", "ACADEMICS", f"Assigned teacher {teacher_id} to class {class_level_id} subject {subject_id}")

    return jsonify({"message": "Teacher assigned successfully", "assignment": ta.to_dict()}), 201

# Academic Years & Terms
@academics_bp.route("/academic-years", methods=["GET"])
@jwt_required()
def list_academic_years():
    years = AcademicYear.query.order_by(AcademicYear.start_date.desc()).all()
    return jsonify({"academic_years": [y.to_dict() for y in years]}), 200

@academics_bp.route("/academic-years", methods=["POST"])
@jwt_required()
@role_required("super_admin")
def create_academic_year():
    current_user = get_current_user()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    is_current = data.get("is_current", False)

    if not name or not start_date or not end_date:
        return jsonify({"error": "Name, start date, and end date are required"}), 400

    if is_current:
        AcademicYear.query.update({"is_current": False})

    ay = AcademicYear(name=name, start_date=start_date, end_date=end_date, is_current=is_current)
    db.session.add(ay)
    db.session.commit()
    log_audit_action(current_user.id, "ACADEMIC_YEAR_CREATE", "ACADEMICS", f"Created academic year {name}")

    return jsonify({"message": "Academic year created successfully", "academic_year": ay.to_dict()}), 201

@academics_bp.route("/terms", methods=["GET"])
@jwt_required()
def list_terms():
    year_id = request.args.get("year_id", type=int)
    query = Term.query
    if year_id:
        query = query.filter_by(academic_year_id=year_id)
    terms = query.order_by(Term.term_number.asc()).all()
    return jsonify({"terms": [t.to_dict() for t in terms]}), 200

@academics_bp.route("/terms/<int:term_id>/set-current", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def set_current_term(term_id):
    current_user = get_current_user()
    term = Term.query.get_or_404(term_id)

    Term.query.update({"is_current": False})
    term.is_current = True
    db.session.commit()
    log_audit_action(current_user.id, "SET_CURRENT_TERM", "ACADEMICS", f"Set current active term to {term.name}")

    return jsonify({"message": f"{term.name} is now the active term", "term": term.to_dict()}), 200
