from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User, Role
from backend.app.utils.audit import log_audit_action

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip() # email or username
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password are required"}), 400

    user = User.query.filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email/username or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Your account has been deactivated. Please contact the administrator."}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    log_audit_action(user.id, "USER_LOGIN", "AUTH", f"User {user.username} logged in successfully")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        return jsonify({"error": "User not found or inactive"}), 404

    res = user.to_dict()
    if user.student_profile:
        res["student_id"] = user.student_profile.id
        res["class_name"] = user.student_profile.current_class.name if user.student_profile.current_class else None
    if user.teacher_profile:
        res["teacher_id"] = user.teacher_profile.id
    if user.guardian_profile:
        res["guardian_id"] = user.guardian_profile.id
        res["children"] = [sg.student.to_dict() for sg in user.guardian_profile.students if sg.student]
    return jsonify({"user": res}), 200

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    current_pwd = data.get("current_password", "")
    new_pwd = data.get("new_password", "")

    if not user.check_password(current_pwd):
        return jsonify({"error": "Incorrect current password"}), 400
    if len(new_pwd) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user.set_password(new_pwd)
    db.session.commit()
    log_audit_action(user.id, "PASSWORD_CHANGE", "AUTH", "User changed password")

    return jsonify({"message": "Password changed successfully"}), 200

@auth_bp.route("/demo-accounts", methods=["GET"])
def get_demo_accounts():
    """
    Returns available demo accounts for easy role previewing in testing & evaluation.
    """
    demo_emails = [
        ("admin@school.edu.gh", "super_admin", "Dr. Nana Osei Tutu (Super Admin)", "Admin@123"),
        ("headteacher@school.edu.gh", "headteacher", "Mrs. Gladys Boateng (Headteacher)", "Head@123"),
        ("kwame.mensah@school.edu.gh", "teacher", "Mr. Kwame Mensah (Teacher)", "Teacher@123"),
        ("accountant@school.edu.gh", "accountant", "Mr. Emmanuel Amponsah (Bursar)", "Bursar@123"),
        ("parent.kofi@gmail.com", "parent", "Mr. Kofi Annan Dankwa (Parent)", "Parent@123"),
        ("student.ama@school.edu.gh", "student", "Ama Serwaa Dankwa (Student - P5)", "Student@123"),
    ]
    return jsonify({"demo_accounts": demo_emails}), 200
