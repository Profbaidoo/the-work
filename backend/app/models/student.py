from backend.app.models.base import db, BaseModel

class Student(BaseModel):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    admission_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    other_names = db.Column(db.String(80), nullable=True)
    gender = db.Column(db.String(10), nullable=False) # Male, Female
    date_of_birth = db.Column(db.Date, nullable=False)
    admission_date = db.Column(db.Date, nullable=False)
    photo_url = db.Column(db.String(255), nullable=True)
    residential_address = db.Column(db.String(255), nullable=False)
    previous_school = db.Column(db.String(150), nullable=True)
    medical_info = db.Column(db.Text, nullable=True) # allergies, chronic conditions, dietary, restricted
    emergency_contact_name = db.Column(db.String(100), nullable=False)
    emergency_contact_phone = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(30), default="ACTIVE", nullable=False) # ACTIVE, TRANSFERRED, GRADUATED, WITHDRAWN

    # Current class and stream placement
    current_class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    current_stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)

    user = db.relationship("User", back_populates="student_profile")
    current_class = db.relationship("ClassLevel", foreign_keys=[current_class_id], back_populates="students")
    current_stream = db.relationship("Stream", foreign_keys=[current_stream_id], back_populates="students")
    
    # Relationships
    guardians = db.relationship("StudentGuardian", back_populates="student", cascade="all, delete-orphan")
    enrollments = db.relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = db.relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    assessment_scores = db.relationship("AssessmentScore", back_populates="student", cascade="all, delete-orphan")
    report_cards = db.relationship("ReportCard", back_populates="student", cascade="all, delete-orphan")
    invoices = db.relationship("Invoice", back_populates="student", cascade="all, delete-orphan")

    @property
    def full_name(self):
        if self.other_names:
            return f"{self.first_name} {self.other_names} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def to_dict(self, include_sensitive=False):
        data = super().to_dict()
        data["full_name"] = self.full_name
        data["date_of_birth"] = self.date_of_birth.isoformat() if self.date_of_birth else None
        data["admission_date"] = self.admission_date.isoformat() if self.admission_date else None
        data["class_name"] = self.current_class.name if self.current_class else None
        data["stream_name"] = self.current_stream.name if self.current_stream else None
        data["guardians"] = [g.to_dict() for g in self.guardians]
        if not include_sensitive:
            data.pop("medical_info", None)
        return data


class Guardian(BaseModel):
    __tablename__ = "parents_guardians"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    alt_phone = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    occupation = db.Column(db.String(100), nullable=True)
    residential_address = db.Column(db.String(255), nullable=True)

    user = db.relationship("User", back_populates="guardian_profile")
    students = db.relationship("StudentGuardian", back_populates="guardian", cascade="all, delete-orphan")

    def to_dict(self):
        data = super().to_dict()
        data["user_email"] = self.user.email if self.user else self.email
        return data


class StudentGuardian(BaseModel):
    __tablename__ = "student_guardians"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    guardian_id = db.Column(db.Integer, db.ForeignKey("parents_guardians.id", ondelete="CASCADE"), nullable=False)
    relationship_type = db.Column(db.String(50), default="Parent", nullable=False) # Father, Mother, Guardian, Aunt, Uncle
    is_primary = db.Column(db.Boolean, default=True, nullable=False)

    student = db.relationship("Student", back_populates="guardians")
    guardian = db.relationship("Guardian", back_populates="students")

    def to_dict(self):
        return {
            "id": self.id,
            "guardian_id": self.guardian_id,
            "full_name": self.guardian.full_name if self.guardian else None,
            "phone": self.guardian.phone if self.guardian else None,
            "alt_phone": self.guardian.alt_phone if self.guardian else None,
            "email": self.guardian.email if self.guardian else None,
            "relationship_type": self.relationship_type,
            "is_primary": self.is_primary
        }


class Enrollment(BaseModel):
    __tablename__ = "enrollments"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    status = db.Column(db.String(30), default="ENROLLED", nullable=False) # ENROLLED, PROMOTED, REPEATED, COMPLETED

    student = db.relationship("Student", back_populates="enrollments")
    academic_year = db.relationship("AcademicYear", back_populates="enrollments")
    class_level = db.relationship("ClassLevel")
    stream = db.relationship("Stream")

    def to_dict(self):
        data = super().to_dict()
        data["student_name"] = self.student.full_name if self.student else None
        data["admission_number"] = self.student.admission_number if self.student else None
        data["academic_year_name"] = self.academic_year.name if self.academic_year else None
        data["class_name"] = self.class_level.name if self.class_level else None
        data["stream_name"] = self.stream.name if self.stream else None
        return data
