from backend.app.models.base import db, BaseModel

class TimetableSlot(BaseModel):
    __tablename__ = "timetables"

    id = db.Column(db.Integer, primary_key=True)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)

    day_of_week = db.Column(db.String(20), nullable=False) # Monday, Tuesday, Wednesday, Thursday, Friday
    period_number = db.Column(db.Integer, nullable=False) # 1, 2, 3, 4, 5, 6, 7, 8
    start_time = db.Column(db.String(10), nullable=False) # e.g. "08:00"
    end_time = db.Column(db.String(10), nullable=False) # e.g. "08:45"
    room_number = db.Column(db.String(50), default="Main Classroom", nullable=False)

    class_level = db.relationship("ClassLevel")
    stream = db.relationship("Stream")
    subject = db.relationship("Subject")
    teacher = db.relationship("Teacher")
    academic_year = db.relationship("AcademicYear")

    def to_dict(self):
        data = super().to_dict()
        data["class_name"] = self.class_level.name if self.class_level else None
        data["stream_name"] = self.stream.name if self.stream else "All"
        data["subject_name"] = self.subject.name if self.subject else None
        data["teacher_name"] = self.teacher.user.full_name if (self.teacher and self.teacher.user) else None
        return data


class SchoolCalendarEvent(BaseModel):
    __tablename__ = "school_calendar_events"

    id = db.Column(db.Integer, primary_key=True)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    term_id = db.Column(db.Integer, db.ForeignKey("terms.id", ondelete="SET NULL"), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    event_type = db.Column(db.String(50), nullable=False) # ACADEMIC, EXAMINATION, HOLIDAY, PTA_MEETING, SPORTS, EVENT
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_holiday = db.Column(db.Boolean, default=False, nullable=False)

    academic_year = db.relationship("AcademicYear")
    term = db.relationship("Term")

    def to_dict(self):
        data = super().to_dict()
        data["start_date"] = self.start_date.isoformat() if self.start_date else None
        data["end_date"] = self.end_date.isoformat() if self.end_date else None
        data["term_name"] = self.term.name if self.term else "All Terms"
        return data
