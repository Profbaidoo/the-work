from datetime import datetime
import json
import secrets
import hashlib
from backend.app.models.base import db, BaseModel
from backend.app.utils.security import generate_salt, hash_salted_peppered_password, verify_salted_peppered_password

# Association table for Role <-> Permission
role_permissions = db.Table(
    "role_permissions",
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    db.Column("permission_id", db.Integer, db.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

class Role(BaseModel):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # super_admin, headteacher, teacher, accountant, parent, student
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)

    users = db.relationship("User", back_populates="role", lazy="dynamic", foreign_keys="User.role_id")
    permissions = db.relationship("Permission", secondary=role_permissions, backref=db.backref("roles", lazy="dynamic"))

    def to_dict(self):
        data = super().to_dict()
        data["permissions"] = [p.name for p in self.permissions]
        return data


class Permission(BaseModel):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False) # e.g. 'students:create', 'fees:record'
    module = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)


class User(BaseModel):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    salt = db.Column(db.String(64), nullable=True) # Cryptographic per-user salt
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # Dual-Role Authorization
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    secondary_role_id = db.Column(db.Integer, db.ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)

    role = db.relationship("Role", foreign_keys=[role_id], back_populates="users")
    secondary_role = db.relationship("Role", foreign_keys=[secondary_role_id])

    # Two-Factor Authentication (2FA) with Phone TOTP
    two_factor_enabled = db.Column(db.Boolean, default=False, nullable=False)
    two_factor_secret = db.Column(db.String(64), nullable=True)
    backup_codes = db.Column(db.Text, nullable=True)

    # Linked profiles
    teacher_profile = db.relationship("Teacher", back_populates="user", uselist=False, cascade="all, delete-orphan")
    student_profile = db.relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    guardian_profile = db.relationship("Guardian", back_populates="user", uselist=False, cascade="all, delete-orphan")
    staff_profile = db.relationship("Staff", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.salt = generate_salt(16)
        self.password_hash = hash_salted_peppered_password(password, self.salt)

    def check_password(self, password):
        return verify_salted_peppered_password(password, self.salt, self.password_hash)

    def generate_backup_codes(self):
        """Generates 6 single-use recovery codes."""
        raw_codes = [secrets.token_hex(4).upper() for _ in range(6)]
        hashed = [hashlib.sha256(c.encode()).hexdigest() for c in raw_codes]
        self.backup_codes = json.dumps(hashed)
        return raw_codes

    def verify_backup_code(self, code):
        if not self.backup_codes or not code:
            return False
        hashed_input = hashlib.sha256(code.strip().upper().encode()).hexdigest()
        codes = json.loads(self.backup_codes)
        if hashed_input in codes:
            codes.remove(hashed_input)
            self.backup_codes = json.dumps(codes)
            db.session.commit()
            return True
        return False

    def has_role(self, *role_names):
        """Dual-role authorization: matches primary or secondary role."""
        primary = self.role.name if self.role else None
        secondary = self.secondary_role.name if self.secondary_role else None
        return any(r in (primary, secondary) for r in role_names)

    def has_permission(self, permission_name):
        if not self.role:
            return False
        if self.has_role("super_admin"):
            return True
        primary_perms = [p.name for p in self.role.permissions] if self.role else []
        secondary_perms = [p.name for p in self.secondary_role.permissions] if self.secondary_role else []
        return permission_name in primary_perms or permission_name in secondary_perms

    def to_dict(self):
        data = super().to_dict()
        data.pop("password_hash", None)
        data.pop("salt", None)
        data.pop("two_factor_secret", None)
        data.pop("backup_codes", None)
        data["role_name"] = self.role.name if self.role else None
        data["role_display_name"] = self.role.display_name if self.role else None
        data["secondary_role_name"] = self.secondary_role.name if self.secondary_role else None
        data["secondary_role_display_name"] = self.secondary_role.display_name if self.secondary_role else None
        data["two_factor_enabled"] = self.two_factor_enabled
        data["permissions"] = [p.name for p in self.role.permissions] if self.role else []
        return data


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)

    user = db.relationship("User", backref=db.backref("audit_logs", lazy="dynamic"))
