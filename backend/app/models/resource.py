from backend.app.models.base import db, BaseModel

class LibraryBook(BaseModel):
    __tablename__ = "library_books"

    id = db.Column(db.Integer, primary_key=True)
    book_code = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. "LIB-2024-001"
    isbn = db.Column(db.String(50), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=False) # e.g. "Science", "Literature", "Mathematics", "Ghanaian History"
    total_copies = db.Column(db.Integer, default=1, nullable=False)
    available_copies = db.Column(db.Integer, default=1, nullable=False)
    shelf_location = db.Column(db.String(50), nullable=True)
    publication_year = db.Column(db.Integer, nullable=True)

    loans = db.relationship("BookLoan", back_populates="book", cascade="all, delete-orphan")

    def to_dict(self):
        return super().to_dict()


class BookLoan(BaseModel):
    __tablename__ = "book_loans"

    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("library_books.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=True)
    borrow_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default="BORROWED", nullable=False) # BORROWED, RETURNED, OVERDUE, LOST
    fine_amount = db.Column(db.Float, default=0.0, nullable=False) # in GHS
    fine_paid = db.Column(db.Boolean, default=False, nullable=False)
    issued_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    book = db.relationship("LibraryBook", back_populates="loans")
    student = db.relationship("Student")
    teacher = db.relationship("Teacher")
    issuer = db.relationship("User")

    def to_dict(self):
        data = super().to_dict()
        data["book_title"] = self.book.title if self.book else None
        data["book_code"] = self.book.book_code if self.book else None
        data["borrow_date"] = self.borrow_date.isoformat() if self.borrow_date else None
        data["due_date"] = self.due_date.isoformat() if self.due_date else None
        data["return_date"] = self.return_date.isoformat() if self.return_date else None
        if self.student:
            data["borrower_name"] = self.student.full_name
            data["borrower_type"] = "Student"
            data["borrower_id"] = self.student.admission_number
        elif self.teacher:
            data["borrower_name"] = self.teacher.user.full_name if self.teacher.user else None
            data["borrower_type"] = "Teacher"
            data["borrower_id"] = self.teacher.staff_id
        return data


class SchoolAsset(BaseModel):
    __tablename__ = "school_assets"

    id = db.Column(db.Integer, primary_key=True)
    asset_code = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. "AST-ICT-001"
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=False) # COMPUTERS_ICT, FURNITURE, TEXTBOOKS, SPORTS, LABORATORY, VEHICLES, PROPERTY
    quantity = db.Column(db.Integer, default=1, nullable=False)
    purchase_date = db.Column(db.Date, nullable=True)
    purchase_cost = db.Column(db.Float, default=0.0, nullable=False) # in GHS
    current_condition = db.Column(db.String(30), default="GOOD", nullable=False) # GOOD, FAIR, NEEDS_REPAIR, DAMAGED, DISPOSED
    location = db.Column(db.String(100), nullable=False) # e.g. "Computer Lab A", "JHS 2 Classroom", "Staff Room"
    assigned_to = db.Column(db.String(150), nullable=True)
    maintenance_notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        data = super().to_dict()
        data["purchase_date"] = self.purchase_date.isoformat() if self.purchase_date else None
        return data
