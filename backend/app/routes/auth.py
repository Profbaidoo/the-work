from datetime import datetime, timedelta
import urllib.parse
import pyotp
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User, Role
from backend.app.models.student import Guardian, Student
from backend.app.models.staff import Teacher
from backend.app.utils.audit import log_audit_action
from backend.app.utils.auth_middleware import get_current_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Public self-registration endpoint for parents, students, and staff.
    """
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip() or "+233 256331492"
    password = data.get("password", "")
    requested_role = data.get("role", "parent").lower()
    residential_address = data.get("residential_address", "").strip() or "Accra, Ghana"
    relationship_type = data.get("relationship_type", "Parent").strip()

    if not full_name or not username or not email or not password:
        return jsonify({"message": "Full name, username, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long."}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"message": "A user with this username or email already exists."}), 409

    allowed_roles = ["parent", "student", "teacher"]
    role_name = requested_role if requested_role in allowed_roles else "parent"
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"message": f"Role '{role_name}' is not recognized."}), 400

    user = User(
        username=username,
        email=email,
        full_name=full_name,
        phone=phone,
        role_id=role.id,
        is_active=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Automatically create profile for Parent
    if role_name == "parent":
        guardian = Guardian(
            user_id=user.id,
            full_name=full_name,
            phone=phone,
            email=email,
            residential_address=residential_address
        )
        db.session.add(guardian)

    db.session.commit()
    log_audit_action(user.id, "USER_SELF_REGISTER", "AUTH", f"New user {username} ({role_name}) signed up.")

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Registration successful! Welcome to Charity Preparatory School.",
        "user": user.to_dict(),
        "token": access_token
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip() or data.get("username", "").strip()
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

    # Check Two-Factor Authentication requirement
    if user.two_factor_enabled and user.two_factor_secret:
        # Issue short-lived temp token for 2FA verification step
        temp_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(minutes=5),
            additional_claims={"two_factor_pending": True}
        )
        return jsonify({
            "two_factor_required": True,
            "temp_token": temp_token,
            "message": "Two-factor authentication required. Scan QR code or enter your 6-digit code."
        }), 200

    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    log_audit_action(user.id, "USER_LOGIN", "AUTH", f"User {user.username} logged in successfully")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "two_factor_required": False,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/login/2fa-verify", methods=["POST"])
@jwt_required()
def verify_2fa_login():
    """
    Verifies the 6-digit TOTP code from phone authenticator or backup code.
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        return jsonify({"error": "User session invalid or inactive"}), 401

    data = request.get_json() or {}
    code = data.get("code", "").strip()
    if not code:
        return jsonify({"error": "Verification code is required"}), 400

    is_valid = False
    if user.two_factor_secret:
        totp = pyotp.TOTP(user.two_factor_secret)
        is_valid = totp.verify(code, valid_window=1)

    if not is_valid:
        # Check emergency backup codes
        is_valid = user.verify_backup_code(code)

    if not is_valid:
        return jsonify({"error": "Invalid 6-digit verification code or backup code"}), 400

    user.last_login = datetime.utcnow()
    db.session.commit()
    log_audit_action(user.id, "2FA_LOGIN_SUCCESS", "AUTH", f"User {user.username} authenticated with 2FA")

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Two-factor authentication verified successfully",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/2fa/qr-setup", methods=["GET", "POST"])
@jwt_required()
def get_2fa_qr():
    """
    Generates TOTP secret and standard otpauth URI/QR code for phone authenticators
    (Google Authenticator, Microsoft Authenticator).
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.two_factor_secret:
        user.two_factor_secret = pyotp.random_base32()
        db.session.commit()

    totp = pyotp.TOTP(user.two_factor_secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.username,
        issuer_name="Charity Preparatory School"
    )

    encoded_uri = urllib.parse.quote(provisioning_uri)
    qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={encoded_uri}"

    return jsonify({
        "secret": user.two_factor_secret,
        "qr_image_url": qr_image_url,
        "otpauth_uri": provisioning_uri,
        "username": user.username,
        "two_factor_enabled": user.two_factor_enabled
    }), 200

@auth_bp.route("/2fa/confirm", methods=["POST"])
@jwt_required()
def confirm_2fa():
    """
    Confirms TOTP setup by verifying the first code from phone and generates 6 backup codes.
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    code = data.get("code", "").strip()

    if not user.two_factor_secret:
        return jsonify({"error": "Please request QR setup first"}), 400

    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(code, valid_window=1):
        return jsonify({"error": "Invalid code. Please scan the QR code and try again."}), 400

    user.two_factor_enabled = True
    backup_codes = user.generate_backup_codes()
    db.session.commit()
    log_audit_action(user.id, "2FA_ACTIVATED", "AUTH", "User enabled Two-Factor Authentication")

    return jsonify({
        "message": "Two-Factor Authentication successfully activated!",
        "two_factor_enabled": True,
        "backup_codes": backup_codes
    }), 200

@auth_bp.route("/2fa/disable", methods=["POST"])
@jwt_required()
def disable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    password = data.get("password", "")
    if not user.check_password(password):
        return jsonify({"error": "Incorrect password. Cannot disable 2FA."}), 400

    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.backup_codes = None
    db.session.commit()
    log_audit_action(user.id, "2FA_DISABLED", "AUTH", "User disabled Two-Factor Authentication")

    return jsonify({"message": "Two-Factor Authentication has been disabled"}), 200

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
    demo_emails = [
        ("admin@school.edu.gh", "super_admin", "Dr. Nana Osei Tutu (Super Admin)", "Admin@123"),
        ("headteacher@school.edu.gh", "headteacher", "Mrs. Gladys Boateng (Headteacher)", "Head@123"),
        ("kwame.mensah@school.edu.gh", "teacher", "Mr. Kwame Mensah (Teacher)", "Teacher@123"),
        ("accountant@school.edu.gh", "accountant", "Mr. Emmanuel Amponsah (Bursar)", "Bursar@123"),
        ("parent.kofi@gmail.com", "parent", "Mr. Kofi Annan Dankwa (Parent)", "Parent@123"),
        ("student.ama@school.edu.gh", "student", "Ama Serwaa Dankwa (Student - P5)", "Student@123"),
    ]
    return jsonify({"demo_accounts": demo_emails}), 200
