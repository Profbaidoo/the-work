from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import Teacher, Staff, StaffAttendance, User, Role
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")

@staff_bp.route("/teachers", methods=["GET"])
@jwt_required()
def list_teachers():
    teachers = Teacher.query.all()
    return jsonify({"teachers": [t.to_dict() for t in teachers]}), 200

@staff_bp.route("/non-teaching", methods=["GET"])
@jwt_required()
def list_non_teaching_staff():
    staff_members = Staff.query.all()
    return jsonify({"staff": [s.to_dict() for s in staff_members]}), 200

@staff_bp.route("/attendance", methods=["GET"])
@jwt_required()
def get_staff_attendance():
    date_str = request.args.get("date", date.today().isoformat())
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    records = StaffAttendance.query.filter_by(date=target_date).all()
    return jsonify({"records": [r.to_dict() for r in records]}), 200

@staff_bp.route("/attendance", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def record_staff_attendance():
    current_user = get_current_user()
    data = request.get_json() or {}
    date_str = data.get("date", date.today().isoformat())
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    entries = data.get("entries", []) # list of {teacher_id or staff_id, status, remarks}

    for item in entries:
        t_id = item.get("teacher_id")
        s_id = item.get("staff_id")
        stat = item.get("status", "PRESENT")
        rmk = item.get("remarks")

        att = StaffAttendance.query.filter_by(
            date=target_date, teacher_id=t_id, staff_id=s_id
        ).first()

        if att:
            att.status = stat
            att.remarks = rmk
        else:
            att = StaffAttendance(
                teacher_id=t_id,
                staff_id=s_id,
                date=target_date,
                status=stat,
                remarks=rmk
            )
            db.session.add(att)

    db.session.commit()
    log_audit_action(current_user.id, "STAFF_ATTENDANCE_RECORD", "STAFF", f"Recorded staff attendance for {len(entries)} members on {date_str}")
    return jsonify({"message": "Staff attendance saved successfully"}), 200
