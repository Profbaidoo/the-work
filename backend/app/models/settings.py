from backend.app.models.base import db, BaseModel

class SchoolSetting(BaseModel):
    __tablename__ = "school_settings"

    id = db.Column(db.Integer, primary_key=True)
    school_name = db.Column(db.String(200), default="Achimota Royal Basic Academy", nullable=False)
    school_motto = db.Column(db.String(255), default="Knowledge, Discipline, and Excellence", nullable=False)
    school_code = db.Column(db.String(50), default="ARBA-GH", nullable=False)
    logo_url = db.Column(db.String(255), nullable=True)
    address = db.Column(db.String(255), default="P.O. Box AC 48, Achimota - Accra, Ghana", nullable=False)
    phone = db.Column(db.String(50), default="+233 24 412 3456", nullable=False)
    alt_phone = db.Column(db.String(50), default="+233 20 890 1234", nullable=True)
    email = db.Column(db.String(120), default="info@achimotabasic.edu.gh", nullable=False)
    website = db.Column(db.String(150), default="https://achimotabasic.edu.gh", nullable=True)

    currency = db.Column(db.String(10), default="GHS", nullable=False)
    currency_symbol = db.Column(db.String(10), default="GH₵", nullable=False)
    
    # Academic assessment configuration
    ca_weight_percentage = db.Column(db.Float, default=30.0, nullable=False) # Continuous Assessment % (e.g. 30% or 50%)
    exam_weight_percentage = db.Column(db.Float, default=70.0, nullable=False) # Exam % (e.g. 70% or 50%)
    ranking_enabled = db.Column(db.Boolean, default=True, nullable=False)

    # Current term and year pointers
    current_academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True)
    current_term_id = db.Column(db.Integer, db.ForeignKey("terms.id", ondelete="SET NULL"), nullable=True)

    # Integrations status
    sms_provider = db.Column(db.String(50), nullable=True) # e.g. "Arkesel", "Hubtel", "Twilio"
    sms_configured = db.Column(db.Boolean, default=False, nullable=False)
    email_configured = db.Column(db.Boolean, default=False, nullable=False)
    whatsapp_configured = db.Column(db.Boolean, default=False, nullable=False)
    momo_configured = db.Column(db.Boolean, default=False, nullable=False) # e.g. Paystack / Hubtel

    academic_year = db.relationship("AcademicYear", foreign_keys=[current_academic_year_id])
    term = db.relationship("Term", foreign_keys=[current_term_id])

    def to_dict(self):
        data = super().to_dict()
        data["current_academic_year_name"] = self.academic_year.name if self.academic_year else None
        data["current_term_name"] = self.term.name if self.term else None
        return data
