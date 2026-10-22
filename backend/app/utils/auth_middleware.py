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

            role_name = user.role.name if user.role else ""
            if role_name == "super_admin":
                return fn(*args, **kwargs)

            if role_name not in allowed_roles:
                return jsonify({
                    "error": "Forbidden: You do not have permission to perform this action",
                    "required_roles": allowed_roles,
                    "current_role": role_name
                }), 403

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
