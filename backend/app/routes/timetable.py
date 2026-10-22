from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import TimetableSlot, SchoolCalendarEvent, Teacher, ClassLevel, Subject, AcademicYear
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

timetable_bp = Blueprint("timetable", __name__, url_prefix="/api/timetable")

@timetable_bp.route("/slots", methods=["GET"])
@jwt_required()
def list_slots():
    class_id = request.args.get("class_id", type=int)
    stream_id = request.args.get("stream_id", type=int)
    teacher_id = request.args.get("teacher_id", type=int)
    day = request.args.get("day")

    query = TimetableSlot.query
    if class_id:
        query = query.filter_by(class_level_id=class_id)
    if stream_id:
        query = query.filter_by(stream_id=stream_id)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if day:
        query = query.filter_by(day_of_week=day)

    slots = query.order_by(TimetableSlot.period_number.asc()).all()
    return jsonify({"slots": [s.to_dict() for s in slots]}), 200

@timetable_bp.route("/slots", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_slot():
    current_user = get_current_user()
    data = request.get_json() or {}
    academic_year_id = data.get("academic_year_id")
    class_level_id = data.get("class_level_id")
    stream_id = data.get("stream_id")
    subject_id = data.get("subject_id")
    teacher_id = data.get("teacher_id")
    day_of_week = data.get("day_of_week")
    period_number = data.get("period_number")
    start_time = data.get("start_time", "08:00")
    end_time = data.get("end_time", "08:45")
    room_number = data.get("room_number", "Main Classroom")

    if not class_level_id or not subject_id or not teacher_id or not day_of_week or not period_number:
        return jsonify({"error": "Class, Subject, Teacher, Day, and Period are required"}), 400

    # Conflict Check 1: Teacher double booking
    teacher_conflict = TimetableSlot.query.filter_by(
        teacher_id=teacher_id,
        day_of_week=day_of_week,
        period_number=period_number
    ).first()
    if teacher_conflict:
        return jsonify({
            "error": f"Teacher conflict: Selected teacher is already teaching in {teacher_conflict.class_level.name} during Period {period_number} on {day_of_week}."
        }), 409

    # Conflict Check 2: Classroom double booking
    if room_number and room_number != "Main Classroom":
        room_conflict = TimetableSlot.query.filter_by(
            room_number=room_number,
            day_of_week=day_of_week,
            period_number=period_number
        ).first()
        if room_conflict:
            return jsonify({
                "error": f"Room conflict: {room_number} is already occupied by {room_conflict.class_level.name} during Period {period_number} on {day_of_week}."
            }), 409

    slot = TimetableSlot(
        academic_year_id=academic_year_id or 1,
        class_level_id=class_level_id,
        stream_id=stream_id,
        subject_id=subject_id,
        teacher_id=teacher_id,
        day_of_week=day_of_week,
        period_number=period_number,
        start_time=start_time,
        end_time=end_time,
        room_number=room_number
    )
    db.session.add(slot)
    db.session.commit()
    log_audit_action(current_user.id, "TIMETABLE_SLOT_CREATE", "ACADEMICS", f"Created timetable period {period_number} on {day_of_week}")

    return jsonify({"message": "Timetable period assigned successfully", "slot": slot.to_dict()}), 201

# School Calendar Events
@timetable_bp.route("/calendar-events", methods=["GET"])
@jwt_required()
def list_calendar_events():
    events = SchoolCalendarEvent.query.order_by(SchoolCalendarEvent.start_date.asc()).all()
    return jsonify({"events": [e.to_dict() for e in events]}), 200

@timetable_bp.route("/calendar-events", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_calendar_event():
    current_user = get_current_user()
    data = request.get_json() or {}
    academic_year_id = data.get("academic_year_id", 1)
    term_id = data.get("term_id")
    title = data.get("title", "").strip()
    event_type = data.get("event_type", "ACADEMIC")
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    description = data.get("description")
    is_holiday = data.get("is_holiday", False)

    if not title or not start_date_str or not end_date_str:
        return jsonify({"error": "Title, start date, and end date are required"}), 400

    sdate = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    edate = datetime.strptime(end_date_str, "%Y-%m-%d").date()

    ev = SchoolCalendarEvent(
        academic_year_id=academic_year_id,
        term_id=term_id,
        title=title,
        event_type=event_type,
        start_date=sdate,
        end_date=edate,
        description=description,
        is_holiday=is_holiday
    )
    db.session.add(ev)
    db.session.commit()
    log_audit_action(current_user.id, "CALENDAR_EVENT_CREATE", "ACADEMICS", f"Added event: {title}")

    return jsonify({"message": "Calendar event added successfully", "event": ev.to_dict()}), 201
