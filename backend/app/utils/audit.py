from flask import request
from backend.app.models.base import db
from backend.app.models.user import AuditLog

def log_audit_action(user_id, action, module, details=None, ip_address=None):
    try:
        if not ip_address:
            try:
                ip_address = request.remote_addr
            except RuntimeError:
                ip_address = "127.0.0.1"

        log = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            details=str(details) if details else None,
            ip_address=ip_address
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[Audit Error] Failed to log action: {e}")
