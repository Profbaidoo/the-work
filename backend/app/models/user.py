from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.models.base import db, BaseModel

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

    users = db.relationship("User", back_populates="role", lazy="dynamic")
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
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    role = db.relationship("Role", back_populates="users")

    # Linked profiles
    teacher_profile = db.relationship("Teacher", back_populates="user", uselist=False, cascade="all, delete-orphan")
    student_profile = db.relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    guardian_profile = db.relationship("Guardian", back_populates="user", uselist=False, cascade="all, delete-orphan")
    staff_profile = db.relationship("Staff", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def has_permission(self, permission_name):
        if not self.role:
            return False
        if self.role.name == "super_admin":
            return True
        return any(p.name == permission_name for p in self.role.permissions)

    def to_dict(self):
        data = super().to_dict()
        data.pop("password_hash", None)
        data["role_name"] = self.role.name if self.role else None
        data["role_display_name"] = self.role.display_name if self.role else None
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
