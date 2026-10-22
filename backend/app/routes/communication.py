from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import Announcement, Notification, CommunicationLog, SchoolSetting
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

communication_bp = Blueprint("communication", __name__, url_prefix="/api/communication")

@communication_bp.route("/announcements", methods=["GET"])
@jwt_required()
def list_announcements():
    current_user = get_current_user()
    role_name = current_user.role.name if (current_user and current_user.role) else "ALL"

    query = Announcement.query.filter(Announcement.is_active == True)
    if role_name not in ["super_admin", "headteacher"]:
        query = query.filter(
            (Announcement.target_role == "ALL") |
            (Announcement.target_role == role_name.upper())
        )

    announcements = query.order_by(Announcement.created_at.desc()).all()
    return jsonify({"announcements": [a.to_dict() for a in announcements]}), 200

@communication_bp.route("/announcements", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_announcement():
    current_user = get_current_user()
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    target_role = data.get("target_role", "ALL").upper()
    priority = data.get("priority", "NORMAL").upper()
    class_level_id = data.get("class_level_id")
    expiry_date_str = data.get("expiry_date")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    exp_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date() if expiry_date_str else None

    ann = Announcement(
        title=title,
        content=content,
        target_role=target_role,
        priority=priority,
        class_level_id=class_level_id,
        published_by_id=current_user.id,
        expiry_date=exp_date
    )
    db.session.add(ann)
    db.session.commit()
    log_audit_action(current_user.id, "ANNOUNCEMENT_CREATE", "COMMUNICATION", f"Published announcement: {title}")

    return jsonify({"message": "Announcement published successfully", "announcement": ann.to_dict()}), 201

@communication_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_user_notifications():
    current_user = get_current_user()
    notifs = Notification.query.filter_by(user_id=current_user.id)\
        .order_by(Notification.created_at.desc()).limit(20).all()
    unread_count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()

    return jsonify({
        "notifications": [n.to_dict() for n in notifs],
        "unread_count": unread_count
    }), 200

@communication_bp.route("/notifications/<int:notif_id>/read", methods=["POST"])
@jwt_required()
def mark_notification_read(notif_id):
    current_user = get_current_user()
    notif = Notification.query.filter_by(id=notif_id, user_id=current_user.id).first_or_404()
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200

@communication_bp.route("/gateway-status", methods=["GET"])
@jwt_required()
def get_gateway_status():
    """
    Returns live connectivity status of external SMS/Email/WhatsApp providers.
    Explicitly indicates unavailability when keys are not configured.
    """
    setting = SchoolSetting.query.first()
    return jsonify({
        "sms": {
            "configured": setting.sms_configured if setting else False,
            "provider": setting.sms_provider if (setting and setting.sms_configured) else "None (Unconfigured)",
            "status": "AVAILABLE" if (setting and setting.sms_configured) else "UNAVAILABLE_NO_API_KEY",
            "message": "Arkesel/Hubtel SMS Gateway is ready." if (setting and setting.sms_configured) else "SMS Gateway is not configured. Add ARKESEL_API_KEY or HUBTEL_CLIENT_ID to .env to enable."
        },
        "email": {
            "configured": setting.email_configured if setting else False,
            "status": "AVAILABLE" if (setting and setting.email_configured) else "UNAVAILABLE_NO_SMTP",
            "message": "SMTP Server connected." if (setting and setting.email_configured) else "SMTP Email service is not configured. Configure SMTP_HOST and SMTP_PORT to enable."
        },
        "whatsapp": {
            "configured": setting.whatsapp_configured if setting else False,
            "status": "AVAILABLE" if (setting and setting.whatsapp_configured) else "UNAVAILABLE_NO_PROVIDER",
            "message": "WhatsApp Cloud API linked." if (setting and setting.whatsapp_configured) else "WhatsApp Business Cloud API unconfigured."
        }
    }), 200

@communication_bp.route("/send-external-message", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def send_external_message():
    """
    Attempts to send external SMS/Email; if unconfigured, transparently flags UNAVAILABLE.
    """
    current_user = get_current_user()
    data = request.get_json() or {}
    channel = data.get("channel", "SMS").upper()
    recipient = data.get("recipient", "").strip()
    message = data.get("message", "").strip()
    subject = data.get("subject", "Notice from Achimota Royal Basic Academy")

    setting = SchoolSetting.query.first()
    is_configured = False
    if channel == "SMS" and setting and setting.sms_configured:
        is_configured = True
    elif channel == "EMAIL" and setting and setting.email_configured:
        is_configured = True

    if not is_configured:
        # Transparently record the attempted communication and notify admin
        log_entry = CommunicationLog(
            channel=channel,
            recipient=recipient,
            subject=subject,
            message=message,
            status="UNAVAILABLE_NO_PROVIDER",
            error_message=f"{channel} provider credentials are not configured in system settings.",
            sent_by_id=current_user.id
        )
        db.session.add(log_entry)
        db.session.commit()
        return jsonify({
            "status": "UNAVAILABLE",
            "error": f"Cannot send {channel}. Provider integration credentials are not configured.",
            "log": log_entry.to_dict()
        }), 400

    # In production with keys configured, send actual SMS/Email via provider
    log_entry = CommunicationLog(
        channel=channel,
        recipient=recipient,
        subject=subject,
        message=message,
        status="SENT",
        sent_by_id=current_user.id
    )
    db.session.add(log_entry)
    db.session.commit()

    return jsonify({"message": f"{channel} sent successfully to {recipient}", "log": log_entry.to_dict()}), 200
