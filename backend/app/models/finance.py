from backend.app.models.base import db, BaseModel

class FeeStructure(BaseModel):
    __tablename__ = "fee_structures"

    id = db.Column(db.Integer, primary_key=True)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    term_id = db.Column(db.Integer, db.ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    class_level_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=True) # None = all classes
    title = db.Column(db.String(100), nullable=False) # "Tuition", "PTA Levy", "Feeding Fee", "ICT / Exam"
    amount = db.Column(db.Float, nullable=False) # In GHS
    is_mandatory = db.Column(db.Boolean, default=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    academic_year = db.relationship("AcademicYear")
    term = db.relationship("Term")
    class_level = db.relationship("ClassLevel")

    def to_dict(self):
        data = super().to_dict()
        data["academic_year_name"] = self.academic_year.name if self.academic_year else None
        data["term_name"] = self.term.name if self.term else None
        data["class_name"] = self.class_level.name if self.class_level else "All Classes"
        return data


class Invoice(BaseModel):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    term_id = db.Column(db.Integer, db.ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    total_amount = db.Column(db.Float, default=0.0, nullable=False)
    discount_amount = db.Column(db.Float, default=0.0, nullable=False)
    paid_amount = db.Column(db.Float, default=0.0, nullable=False)
    balance_due = db.Column(db.Float, default=0.0, nullable=False)
    status = db.Column(db.String(30), default="UNPAID", nullable=False) # UNPAID, PARTIALLY_PAID, PAID, OVERPAID
    due_date = db.Column(db.Date, nullable=True)

    student = db.relationship("Student", back_populates="invoices")
    academic_year = db.relationship("AcademicYear")
    term = db.relationship("Term")
    payments = db.relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    def recalculate_balance(self):
        confirmed_payments = sum(p.amount for p in self.payments if p.status == "CONFIRMED")
        self.paid_amount = confirmed_payments
        net_due = max(0.0, self.total_amount - self.discount_amount)
        self.balance_due = net_due - self.paid_amount
        if self.balance_due <= 0 and net_due > 0:
            self.status = "PAID"
        elif self.paid_amount > 0 and self.balance_due > 0:
            self.status = "PARTIALLY_PAID"
        elif self.paid_amount == 0:
            self.status = "UNPAID"

    def to_dict(self):
        data = super().to_dict()
        data["student_name"] = self.student.full_name if self.student else None
        data["admission_number"] = self.student.admission_number if self.student else None
        data["class_name"] = self.student.current_class.name if (self.student and self.student.current_class) else None
        data["term_name"] = self.term.name if self.term else None
        data["academic_year_name"] = self.academic_year.name if self.academic_year else None
        data["due_date"] = self.due_date.isoformat() if self.due_date else None
        data["payments_count"] = len(self.payments)
        return data


class Payment(BaseModel):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    reference_number = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. "RCP-2026-0042"
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(30), nullable=False) # CASH, BANK_TRANSFER, MTN_MOMO, TELECEL_CASH, AIRTELTIGO_MONEY, CHEQUE
    external_transaction_id = db.Column(db.String(100), nullable=True)
    payment_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), default="CONFIRMED", nullable=False) # CONFIRMED, PENDING, FAILED
    notes = db.Column(db.String(255), nullable=True)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    invoice = db.relationship("Invoice", back_populates="payments")
    student = db.relationship("Student")
    recorded_by = db.relationship("User")
    allocations = db.relationship("PaymentAllocation", back_populates="payment", cascade="all, delete-orphan")

    def to_dict(self):
        data = super().to_dict()
        data["student_name"] = self.student.full_name if self.student else None
        data["admission_number"] = self.student.admission_number if self.student else None
        data["invoice_number"] = self.invoice.invoice_number if self.invoice else None
        data["payment_date"] = self.payment_date.isoformat() if self.payment_date else None
        data["cashier_name"] = self.recorded_by.full_name if self.recorded_by else None
        return data


class PaymentAllocation(BaseModel):
    __tablename__ = "payment_allocations"

    id = db.Column(db.Integer, primary_key=True)
    payment_id = db.Column(db.Integer, db.ForeignKey("payments.id", ondelete="CASCADE"), nullable=False)
    fee_structure_id = db.Column(db.Integer, db.ForeignKey("fee_structures.id", ondelete="CASCADE"), nullable=False)
    amount_allocated = db.Column(db.Float, nullable=False)

    payment = db.relationship("Payment", back_populates="allocations")
    fee_structure = db.relationship("FeeStructure")


class Expense(BaseModel):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False) # SALARIES, UTILITIES, MAINTENANCE, SUPPLIES, FEEDING, OTHER
    title = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    paid_to = db.Column(db.String(150), nullable=False)
    receipt_reference = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="APPROVED", nullable=False) # PENDING, APPROVED, REJECTED
    recorded_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    recorder = db.relationship("User", foreign_keys=[recorded_by_id])
    approver = db.relationship("User", foreign_keys=[approved_by_id])

    def to_dict(self):
        data = super().to_dict()
        data["expense_date"] = self.expense_date.isoformat() if self.expense_date else None
        data["recorder_name"] = self.recorder.full_name if self.recorder else None
        data["approver_name"] = self.approver.full_name if self.approver else None
        return data
