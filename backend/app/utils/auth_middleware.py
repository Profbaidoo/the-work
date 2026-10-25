from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from backend.app.models.user import User

def get_current_user():
    """Returns the authenticated User or None"""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        if user_id:
            return User.query.get(int(user_id))
    except Exception:
        pass
    return None

def role_required(*allowed_roles):
    """
    Decorator ensuring user has one of allowed roles.
    Super admin is always allowed.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            if not user or not user.is_active:
                return jsonify({"error": "User account inactive or not found"}), 403

            if user.has_role("super_admin"):
                return fn(*args, **kwargs)

            if not user.has_role(*allowed_roles):
                role_name = user.role.name if user.role else ""
                return jsonify({
                    "error": "Forbidden: You do not have permission to perform this action",
                    "required_roles": allowed_roles,
                    "current_role": role_name
                }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper

def dual_role_required(*allowed_roles):
    """Alias for dual-role / multi-role check."""
    return role_required(*allowed_roles)

def row_level_class_authorized():
    """
    Row-Level Authorization: Ensures a teacher can only modify attendance
    or assessments for classes they are specifically assigned to.
    Super admin and headteachers have school-wide row access.
    """
    from flask import request
    from backend.app.models.academics import TeacherClassAssignment
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            user = get_current_user()
            if not user or not user.is_active:
                return jsonify({"error": "Unauthorized"}), 401

            if user.has_role("super_admin", "headteacher"):
                return fn(*args, **kwargs)

            # Check class_id from query args, body JSON, or route param
            class_id = request.args.get("class_id") or (request.get_json(silent=True) or {}).get("class_id") or kwargs.get("class_id")
            if class_id and user.has_role("teacher") and user.teacher_profile:
                assignment = TeacherClassAssignment.query.filter_by(
                    teacher_id=user.teacher_profile.id,
                    class_id=int(class_id)
                ).first()
                if not assignment:
                    return jsonify({"error": "Row-level authorization failed: You are not assigned to this class register."}), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper

def permission_required(permission_name):
    """
    Decorator ensuring user's role has the specified permission.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            if not user or not user.is_active:
                return jsonify({"error": "User account inactive or not found"}), 403

            if not user.has_permission(permission_name):
                return jsonify({
                    "error": f"Forbidden: Missing permission '{permission_name}'"
                }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
