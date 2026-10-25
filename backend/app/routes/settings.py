import os
import shutil
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import SchoolSetting, User, Role, Permission, AcademicYear, Term
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

@settings_bp.route("/school-profile", methods=["GET"])
def get_school_profile():
    school = SchoolSetting.query.first()
    if not school:
        school = SchoolSetting()
        db.session.add(school)
        db.session.commit()
    return jsonify({"school": school.to_dict()}), 200

@settings_bp.route("/school-profile", methods=["PUT"])
@jwt_required()
@role_required("super_admin")
def update_school_profile():
    current_user = get_current_user()
    school = SchoolSetting.query.first()
    data = request.get_json() or {}

    fields = [
        "school_name", "school_motto", "school_code", "logo_url",
        "address", "phone", "alt_phone", "email", "website",
        "currency", "currency_symbol", "ca_weight_percentage",
        "exam_weight_percentage", "ranking_enabled",
        "current_academic_year_id", "current_term_id"
    ]
    for f in fields:
        if f in data:
            setattr(school, f, data[f])

    db.session.commit()
    log_audit_action(current_user.id, "SETTINGS_UPDATE", "SETTINGS", "Updated school branding and general settings")

    return jsonify({"message": "School settings updated successfully", "school": school.to_dict()}), 200

# User Management & Permissions
@settings_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required("super_admin", "headteacher")
def list_users():
    users = User.query.order_by(User.id.asc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200

@settings_bp.route("/roles", methods=["GET"])
@jwt_required()
def list_roles():
    roles = Role.query.all()
    return jsonify({"roles": [r.to_dict() for r in roles]}), 200

@settings_bp.route("/users", methods=["POST"])
@jwt_required()
@role_required("super_admin")
def create_user():
    current_user = get_current_user()
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    phone = data.get("phone", "").strip()
    role_id = data.get("role_id")

    if not username or not email or not password or not full_name or not role_id:
        return jsonify({"error": "Username, email, password, full name, and role are required"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already exists"}), 400

    user = User(
        username=username,
        email=email,
        full_name=full_name,
        phone=phone,
        role_id=role_id,
        is_active=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    log_audit_action(current_user.id, "USER_CREATE", "USERS", f"Created user {username} ({email})")

    return jsonify({"message": "User created successfully", "user": user.to_dict()}), 201

@settings_bp.route("/users/<int:user_id>/toggle-status", methods=["POST"])
@jwt_required()
@role_required("super_admin")
def toggle_user_status(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        return jsonify({"error": "Cannot deactivate your own administrator account"}), 400

    user.is_active = not user.is_active
    db.session.commit()
    status_str = "activated" if user.is_active else "deactivated"
    log_audit_action(current_user.id, "USER_STATUS_TOGGLE", "USERS", f"{status_str.capitalize()} account {user.username}")

    return jsonify({"message": f"User account has been {status_str}", "is_active": user.is_active}), 200

# Database Backup & Restore Procedures
from backend.app.utils.backup_manager import (
    create_database_backup,
    list_database_backups,
    restore_database_backup,
    BACKUP_DIR
)

@settings_bp.route("/backups", methods=["GET"])
@jwt_required()
@role_required("super_admin")
def get_backups():
    return jsonify({"backups": list_database_backups()}), 200

@settings_bp.route("/backups/create", methods=["POST"])
@jwt_required()
@role_required("super_admin")
def make_backup():
    current_user = get_current_user()
    info = create_database_backup()
    log_audit_action(current_user.id, "DATABASE_BACKUP", "SETTINGS", f"Created database backup {info['filename']}")
    return jsonify({"message": "Database backup generated successfully.", "backup": info}), 201

@settings_bp.route("/backups/<filename>/download", methods=["GET"])
@jwt_required()
@role_required("super_admin")
def download_backup_file(filename):
    safe_path = os.path.join(BACKUP_DIR, os.path.basename(filename))
    if not os.path.exists(safe_path):
        return jsonify({"error": "Backup file not found"}), 404
    return send_file(safe_path, as_attachment=True, download_name=filename)

@settings_bp.route("/backups/<filename>/restore", methods=["POST"])
@jwt_required()
@role_required("super_admin")
def restore_backup_endpoint(filename):
    current_user = get_current_user()
    try:
        restore_database_backup(filename)
        log_audit_action(current_user.id, "DATABASE_RESTORE", "SETTINGS", f"Restored database from {filename}")
        return jsonify({"message": f"Database successfully restored from {filename}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route("/backup-database", methods=["POST"])
@jwt_required()
@role_required("super_admin")
def backup_database():
    current_user = get_current_user()
    info = create_database_backup()
    log_audit_action(current_user.id, "DATABASE_BACKUP", "SYSTEM", f"Created SQLite database backup {info['filename']}")
    return jsonify({
        "message": "Database backup generated successfully",
        "filename": info["filename"],
        "checksum": info["checksum_sha256"],
        "size_kb": info["size_kb"]
    }), 200
