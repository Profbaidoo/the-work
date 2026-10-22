from datetime import datetime
from backend.app.models.base import db, BaseModel

class Announcement(BaseModel):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    target_role = db.Column(db.String(50), default="ALL", nullable=False) # ALL, TEACHERS, PARENTS, STUDENTS
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="SET NULL"), nullable=True) # None = all classes
    priority = db.Column(db.String(20), default="NORMAL", nullable=False) # LOW, NORMAL, HIGH, URGENT
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    published_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)

    publisher = db.relationship("User")
    class_level = db.relationship("ClassLevel")

    def to_dict(self):
        data = super().to_dict()
        data["publisher_name"] = self.publisher.full_name if self.publisher else None
        data["class_name"] = self.class_level.name if self.class_level else "All Classes"
        data["expiry_date"] = self.expiry_date.isoformat() if self.expiry_date else None
        return data


class Notification(BaseModel):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default="INFO", nullable=False) # INFO, ATTENDANCE, FEES, ACADEMIC, SYSTEM
    link = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User")

    def to_dict(self):
        data = super().to_dict()
        data["read_at"] = self.read_at.isoformat() if self.read_at else None
        return data


class CommunicationLog(BaseModel):
    __tablename__ = "communication_logs"

    id = db.Column(db.Integer, primary_key=True)
    channel = db.Column(db.String(30), nullable=False) # SMS, EMAIL, WHATSAPP, IN_APP
    recipient = db.Column(db.String(150), nullable=False)
    subject = db.Column(db.String(200), nullable=True)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default="SENT", nullable=False) # SENT, FAILED, UNAVAILABLE_NO_PROVIDER
    error_message = db.Column(db.String(255), nullable=True)
    sent_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    sender = db.relationship("User")

    def to_dict(self):
        data = super().to_dict()
        data["sender_name"] = self.sender.full_name if self.sender else None
        return data
