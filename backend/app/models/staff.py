from backend.app.models.base import db, BaseModel

class Teacher(BaseModel):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    staff_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. "TCH-2024-001"
    specialization = db.Column(db.String(100), nullable=True) # e.g. "Mathematics & Science"
    qualification = db.Column(db.String(100), nullable=True) # e.g. "B.Ed. Basic Education, UCC"
    joining_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(30), default="ACTIVE", nullable=False) # ACTIVE, ON_LEAVE, RESIGNED

    user = db.relationship("User", back_populates="teacher_profile")

    def to_dict(self):
        data = super().to_dict()
        data["full_name"] = self.user.full_name if self.user else None
        data["email"] = self.user.email if self.user else None
        data["phone"] = self.user.phone if self.user else None
        data["joining_date"] = self.joining_date.isoformat() if self.joining_date else None
        return data


class Staff(BaseModel):
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, unique=True)
    staff_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. "STF-2024-002"
    full_name = db.Column(db.String(150), nullable=False)
    role_title = db.Column(db.String(100), nullable=False) # e.g. "Bursar", "Librarian", "Administrative Assistant"
    department = db.Column(db.String(100), nullable=True) # "Administration", "Finance", "Facilities"
    phone = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    qualification = db.Column(db.String(100), nullable=True)
    joining_date = db.Column(db.Date, nullable=True)
    employment_status = db.Column(db.String(30), default="ACTIVE", nullable=False) # ACTIVE, ON_LEAVE, TERMINATED

    user = db.relationship("User", back_populates="staff_profile")

    def to_dict(self):
        data = super().to_dict()
        data["joining_date"] = self.joining_date.isoformat() if self.joining_date else None
        return data


class StaffAttendance(BaseModel):
    __tablename__ = "staff_attendance"

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id", ondelete="CASCADE"), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=True)
    date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), default="PRESENT", nullable=False) # PRESENT, ABSENT, LATE, ON_LEAVE
    check_in_time = db.Column(db.String(20), nullable=True)
    remarks = db.Column(db.String(255), nullable=True)

    staff = db.relationship("Staff")
    teacher = db.relationship("Teacher")

    def to_dict(self):
        data = super().to_dict()
        data["date"] = self.date.isoformat() if self.date else None
        if self.teacher:
            data["name"] = self.teacher.user.full_name if self.teacher.user else None
            data["staff_code"] = self.teacher.staff_id
            data["role"] = "Teacher"
        elif self.staff:
            data["name"] = self.staff.full_name
            data["staff_code"] = self.staff.staff_id
            data["role"] = self.staff.role_title
        return data
