from backend.app.models.base import db, BaseModel

class AcademicYear(BaseModel):
    __tablename__ = "academic_years"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False) # e.g. "2025/2026"
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False, nullable=False)

    terms = db.relationship("Term", back_populates="academic_year", cascade="all, delete-orphan")
    enrollments = db.relationship("Enrollment", back_populates="academic_year", lazy="dynamic")

    def to_dict(self):
        data = super().to_dict()
        data["start_date"] = self.start_date.isoformat() if self.start_date else None
        data["end_date"] = self.end_date.isoformat() if self.end_date else None
        data["terms_count"] = len(self.terms)
        return data


class Term(BaseModel):
    __tablename__ = "terms"

    id = db.Column(db.Integer, primary_key=True)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(50), nullable=False) # "Term 1", "Term 2", "Term 3"
    term_number = db.Column(db.Integer, default=1, nullable=False) # 1, 2, 3
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False, nullable=False)

    academic_year = db.relationship("AcademicYear", back_populates="terms")
    assessments = db.relationship("Assessment", back_populates="term", lazy="dynamic")
    report_cards = db.relationship("ReportCard", back_populates="term", lazy="dynamic")

    def to_dict(self):
        data = super().to_dict()
        data["start_date"] = self.start_date.isoformat() if self.start_date else None
        data["end_date"] = self.end_date.isoformat() if self.end_date else None
        data["academic_year_name"] = self.academic_year.name if self.academic_year else None
        return data


class ClassLevel(BaseModel):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # e.g. "Primary 1", "JHS 2"
    code = db.Column(db.String(20), unique=True, nullable=False) # e.g. "P1", "JHS2"
    level_group = db.Column(db.String(20), nullable=False) # NURSERY, KG, PRIMARY, JHS
    order_index = db.Column(db.Integer, default=0, nullable=False)
    capacity = db.Column(db.Integer, default=40, nullable=False)

    streams = db.relationship("Stream", back_populates="class_level", cascade="all, delete-orphan")
    class_subjects = db.relationship("ClassSubject", back_populates="class_level", cascade="all, delete-orphan")
    students = db.relationship("Student", back_populates="current_class", foreign_keys="Student.current_class_id", lazy="dynamic")

    def to_dict(self):
        data = super().to_dict()
        data["streams"] = [s.to_dict() for s in self.streams]
        data["subjects_count"] = len(self.class_subjects)
        return data


class Stream(BaseModel):
    __tablename__ = "streams"

    id = db.Column(db.Integer, primary_key=True)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(50), nullable=False) # "Gold", "Green", "A", "B"
    class_teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)

    class_level = db.relationship("ClassLevel", back_populates="streams")
    class_teacher = db.relationship("Teacher", foreign_keys=[class_teacher_id])
    students = db.relationship("Student", back_populates="current_stream", foreign_keys="Student.current_stream_id", lazy="dynamic")

    def to_dict(self):
        data = super().to_dict()
        data["class_name"] = self.class_level.name if self.class_level else None
        data["class_teacher_name"] = self.class_teacher.user.full_name if (self.class_teacher and self.class_teacher.user) else None
        return data


class Subject(BaseModel):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False) # e.g. "English Language"
    code = db.Column(db.String(20), unique=True, nullable=False) # e.g. "ENG"
    category = db.Column(db.String(30), default="CORE", nullable=False) # CORE, ELECTIVE
    level_group = db.Column(db.String(20), default="ALL", nullable=False) # ALL, NURSERY, KG, PRIMARY, JHS
    description = db.Column(db.String(255), nullable=True)

    class_subjects = db.relationship("ClassSubject", back_populates="subject", cascade="all, delete-orphan")

    def to_dict(self):
        return super().to_dict()


class ClassSubject(BaseModel):
    __tablename__ = "class_subjects"

    id = db.Column(db.Integer, primary_key=True)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)

    class_level = db.relationship("ClassLevel", back_populates="class_subjects")
    subject = db.relationship("Subject", back_populates="class_subjects")

    def to_dict(self):
        data = super().to_dict()
        data["class_name"] = self.class_level.name if self.class_level else None
        data["subject_name"] = self.subject.name if self.subject else None
        data["subject_code"] = self.subject.code if self.subject else None
        return data


class TeacherAssignment(BaseModel):
    __tablename__ = "teacher_assignments"

    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)

    teacher = db.relationship("Teacher", backref=db.backref("assignments", cascade="all, delete-orphan"))
    class_level = db.relationship("ClassLevel")
    stream = db.relationship("Stream")
    subject = db.relationship("Subject")
    academic_year = db.relationship("AcademicYear")

    def to_dict(self):
        data = super().to_dict()
        data["teacher_name"] = self.teacher.user.full_name if (self.teacher and self.teacher.user) else None
        data["class_name"] = self.class_level.name if self.class_level else None
        data["stream_name"] = self.stream.name if self.stream else "All"
        data["subject_name"] = self.subject.name if self.subject else None
        data["academic_year_name"] = self.academic_year.name if self.academic_year else None
        return data
