from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from backend.app.models.base import db
from backend.app.models import Attendance, Student, ClassLevel, Stream
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")

@attendance_bp.route("", methods=["GET"])
@jwt_required()
def get_attendance():
    current_user = get_current_user()
    date_str = request.args.get("date")
    class_id = request.args.get("class_id", type=int)
    stream_id = request.args.get("stream_id", type=int)
    student_id = request.args.get("student_id", type=int)

    query = Attendance.query

    # Student portal access restriction
    if current_user and current_user.role and current_user.role.name == "student":
        if current_user.student_profile:
            query = query.filter(Attendance.student_id == current_user.student_profile.id)
        else:
            return jsonify({"records": []}), 200

    # Parent portal access restriction
    if current_user and current_user.role and current_user.role.name == "parent":
        if current_user.guardian_profile:
            child_ids = [sg.student_id for sg in current_user.guardian_profile.students]
            query = query.filter(Attendance.student_id.in_(child_ids))
        else:
            return jsonify({"records": []}), 200

    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(Attendance.date == target_date)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if class_id:
        query = query.filter(Attendance.class_level_id == class_id)
    if stream_id:
        query = query.filter(Attendance.stream_id == stream_id)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)

    records = query.order_by(Attendance.date.desc()).all()
    return jsonify({"records": [r.to_dict() for r in records]}), 200

@attendance_bp.route("/register", methods=["GET"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def get_class_register():
    """
    Returns full register list for a class & stream on a specific date,
    including both recorded attendance and unrecorded students.
    """
    class_id = request.args.get("class_id", type=int)
    stream_id = request.args.get("stream_id", type=int)
    date_str = request.args.get("date", date.today().isoformat())

    if not class_id:
        return jsonify({"error": "class_id is required"}), 400

    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    # Get active students in class
    st_query = Student.query.filter_by(current_class_id=class_id, status="ACTIVE")
    if stream_id:
        st_query = st_query.filter_by(current_stream_id=stream_id)
    students = st_query.order_by(Student.last_name.asc()).all()

    # Get existing attendance records on this date
    existing_records = {
        att.student_id: att
        for att in Attendance.query.filter(
            Attendance.class_level_id == class_id,
            Attendance.date == target_date
        ).all()
    }

    register = []
    for s in students:
        att = existing_records.get(s.id)
        register.append({
            "student_id": s.id,
            "admission_number": s.admission_number,
            "student_name": s.full_name,
            "gender": s.gender,
            "status": att.status if att else "NOT_RECORDED",
            "reason": att.reason if att else "",
            "parent_notified": att.parent_notified if att else False,
            "attendance_id": att.id if att else None
        })

    return jsonify({
        "date": date_str,
        "class_id": class_id,
        "stream_id": stream_id,
        "register": register
    }), 200

@attendance_bp.route("/bulk", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def bulk_save_attendance():
    """
    Upserts daily attendance for multiple students cleanly in a transaction.
    """
    current_user = get_current_user()
    data = request.get_json() or {}
    class_id = data.get("class_id")
    stream_id = data.get("stream_id")
    date_str = data.get("date", date.today().isoformat())
    entries = data.get("entries", []) # list of {student_id, status, reason, parent_notified}

    if not class_id or not entries:
        return jsonify({"error": "Class ID and attendance entries are required"}), 400

    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    saved_count = 0

    for item in entries:
        st_id = item.get("student_id")
        att_status = item.get("status", "PRESENT")
        reason = item.get("reason")
        notify = item.get("parent_notified", False)

        record = Attendance.query.filter_by(student_id=st_id, date=target_date).first()
        if record:
            record.status = att_status
            record.reason = reason
            record.parent_notified = notify
            record.recorded_by = current_user.id
        else:
            record = Attendance(
                student_id=st_id,
                class_level_id=class_id,
                stream_id=stream_id,
                date=target_date,
                status=att_status,
                reason=reason,
                parent_notified=notify,
                recorded_by=current_user.id
            )
            db.session.add(record)
        saved_count += 1

    db.session.commit()
    log_audit_action(
        current_user.id, "ATTENDANCE_RECORD", "ATTENDANCE",
        f"Recorded daily attendance for {saved_count} students in class {class_id} on {date_str}"
    )

    return jsonify({"message": f"Successfully saved attendance for {saved_count} students", "date": date_str}), 200

@attendance_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_attendance_stats():
    """
    Calculates overall attendance percentages and flags frequent absentees.
    """
    class_id = request.args.get("class_id", type=int)

    base_query = Attendance.query
    if class_id:
        base_query = base_query.filter_by(class_level_id=class_id)

    total_records = base_query.count()
    present_cnt = base_query.filter(Attendance.status.in_(["PRESENT", "LATE"])).count()
    absent_cnt = base_query.filter(Attendance.status == "ABSENT").count()
    excused_cnt = base_query.filter(Attendance.status == "EXCUSED").count()

    overall_percentage = round((present_cnt / total_records * 100), 1) if total_records > 0 else 100.0

    # Identify frequent absentees (e.g. 3 or more absences in recorded dates)
    frequent_absentees_raw = db.session.query(
        Attendance.student_id, func.count(Attendance.id).label("absent_days")
    ).filter(Attendance.status == "ABSENT")\
     .group_by(Attendance.student_id)\
     .having(func.count(Attendance.id) >= 2)\
     .all()

    frequent_absentees = []
    for st_id, count in frequent_absentees_raw:
        st = Student.query.get(st_id)
        if st:
            frequent_absentees.append({
                "student_id": st.id,
                "name": st.full_name,
                "admission_number": st.admission_number,
                "class_name": st.current_class.name if st.current_class else "",
                "absent_days": count
            })

    return jsonify({
        "total_records": total_records,
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "excused_count": excused_cnt,
        "overall_percentage": overall_percentage,
        "frequent_absentees": frequent_absentees
    }), 200
