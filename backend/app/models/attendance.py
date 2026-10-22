from backend.app.models.base import db, BaseModel

class Attendance(BaseModel):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False) # PRESENT, ABSENT, LATE, EXCUSED
    reason = db.Column(db.String(255), nullable=True)
    recorded_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    parent_notified = db.Column(db.Boolean, default=False, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("student_id", "date", name="uq_student_date_attendance"),
    )

    student = db.relationship("Student", back_populates="attendance_records")
    class_level = db.relationship("ClassLevel")
    stream = db.relationship("Stream")
    recorder = db.relationship("User")

    def to_dict(self):
        data = super().to_dict()
        data["date"] = self.date.isoformat() if self.date else None
        data["student_name"] = self.student.full_name if self.student else None
        data["admission_number"] = self.student.admission_number if self.student else None
        data["class_name"] = self.class_level.name if self.class_level else None
        data["stream_name"] = self.stream.name if self.stream else None
        data["recorded_by_name"] = self.recorder.full_name if self.recorder else None
        return data
