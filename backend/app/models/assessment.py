from backend.app.models.base import db, BaseModel

class GradingScale(BaseModel):
    __tablename__ = "grading_scales"

    id = db.Column(db.Integer, primary_key=True)
    grade = db.Column(db.String(10), nullable=False) # e.g. "1", "2", "3", ... "9" or "A+", "A", "B"
    min_score = db.Column(db.Float, nullable=False) # e.g. 80.0
    max_score = db.Column(db.Float, nullable=False) # e.g. 100.0
    remark = db.Column(db.String(50), nullable=False) # "Excellent", "Very Good", "Good", "Credit", "Pass", "Fail"
    grade_point = db.Column(db.Float, default=1.0, nullable=False)
    order_rank = db.Column(db.Integer, default=1, nullable=False)


class Assessment(BaseModel):
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)
    term_id = db.Column(db.Integer, db.ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    name = db.Column(db.String(100), nullable=False) # e.g. "Continuous Assessment 1", "End of Term Exam"
    assessment_type = db.Column(db.String(30), nullable=False) # CLASS_SCORE (30-50%), EXAM (50-70%)
    max_marks = db.Column(db.Float, default=100.0, nullable=False)
    weight_percentage = db.Column(db.Float, default=50.0, nullable=False) # Weighting in final term total
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    is_locked = db.Column(db.Boolean, default=False, nullable=False)

    term = db.relationship("Term", back_populates="assessments")
    class_level = db.relationship("ClassLevel")
    stream = db.relationship("Stream")
    subject = db.relationship("Subject")
    creator = db.relationship("User")
    scores = db.relationship("AssessmentScore", back_populates="assessment", cascade="all, delete-orphan")

    def to_dict(self):
        data = super().to_dict()
        data["term_name"] = self.term.name if self.term else None
        data["class_name"] = self.class_level.name if self.class_level else None
        data["stream_name"] = self.stream.name if self.stream else "All"
        data["subject_name"] = self.subject.name if self.subject else None
        data["creator_name"] = self.creator.full_name if self.creator else None
        data["scores_count"] = len(self.scores)
        return data


class AssessmentScore(BaseModel):
    __tablename__ = "assessment_scores"

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    raw_score = db.Column(db.Float, nullable=False)
    weighted_score = db.Column(db.Float, nullable=True)
    remarks = db.Column(db.String(150), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("assessment_id", "student_id", name="uq_assessment_student_score"),
    )

    assessment = db.relationship("Assessment", back_populates="scores")
    student = db.relationship("Student", back_populates="assessment_scores")

    def to_dict(self):
        data = super().to_dict()
        data["student_name"] = self.student.full_name if self.student else None
        data["admission_number"] = self.student.admission_number if self.student else None
        data["assessment_name"] = self.assessment.name if self.assessment else None
        data["max_marks"] = self.assessment.max_marks if self.assessment else 100
        return data


class ReportCard(BaseModel):
    __tablename__ = "report_cards"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    term_id = db.Column(db.Integer, db.ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)

    total_marks = db.Column(db.Float, default=0.0, nullable=False)
    average_score = db.Column(db.Float, default=0.0, nullable=False)
    overall_grade = db.Column(db.String(10), nullable=True)
    class_position = db.Column(db.Integer, nullable=True)
    total_students_in_class = db.Column(db.Integer, nullable=True)

    attendance_present = db.Column(db.Integer, default=0, nullable=False)
    attendance_total_days = db.Column(db.Integer, default=0, nullable=False)

    class_teacher_remarks = db.Column(db.Text, nullable=True)
    headteacher_remarks = db.Column(db.Text, nullable=True)
    promotion_status = db.Column(db.String(50), nullable=True) # "Promoted to Primary 5", "On Probation"

    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    is_locked = db.Column(db.Boolean, default=False, nullable=False)
    approved_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.UniqueConstraint("student_id", "term_id", name="uq_student_term_report_card"),
    )

    student = db.relationship("Student", back_populates="report_cards")
    academic_year = db.relationship("AcademicYear")
    term = db.relationship("Term", back_populates="report_cards")
    class_level = db.relationship("ClassLevel")
    stream = db.relationship("Stream")
    approver = db.relationship("User")

    def to_dict(self):
        data = super().to_dict()
        data["student_name"] = self.student.full_name if self.student else None
        data["admission_number"] = self.student.admission_number if self.student else None
        data["class_name"] = self.class_level.name if self.class_level else None
        data["stream_name"] = self.stream.name if self.stream else None
        data["term_name"] = self.term.name if self.term else None
        data["academic_year_name"] = self.academic_year.name if self.academic_year else None
        data["approver_name"] = self.approver.full_name if self.approver else None
        data["published_at"] = self.published_at.isoformat() if self.published_at else None
        return data
