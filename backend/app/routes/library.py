from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import LibraryBook, BookLoan, Student, Teacher
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

library_bp = Blueprint("library", __name__, url_prefix="/api/library")

@library_bp.route("/books", methods=["GET"])
@jwt_required()
def list_books():
    search = request.args.get("search", "").strip()
    category = request.args.get("category")

    query = LibraryBook.query
    if search:
        s_fmt = f"%{search}%"
        query = query.filter((LibraryBook.title.ilike(s_fmt)) | (LibraryBook.author.ilike(s_fmt)) | (LibraryBook.book_code.ilike(s_fmt)))
    if category and category != "ALL":
        query = query.filter_by(category=category)

    books = query.order_by(LibraryBook.title.asc()).all()
    return jsonify({"books": [b.to_dict() for b in books]}), 200

@library_bp.route("/books", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def add_book():
    current_user = get_current_user()
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    author = data.get("author", "").strip()
    category = data.get("category", "General")
    total_copies = int(data.get("total_copies", 1))
    book_code = data.get("book_code", f"LIB-{datetime.utcnow().strftime('%Y')}-{LibraryBook.query.count()+1:03d}")
    isbn = data.get("isbn")
    shelf = data.get("shelf_location")

    if not title or not author:
        return jsonify({"error": "Title and author are required"}), 400

    book = LibraryBook(
        book_code=book_code,
        isbn=isbn,
        title=title,
        author=author,
        category=category,
        total_copies=total_copies,
        available_copies=total_copies,
        shelf_location=shelf
    )
    db.session.add(book)
    db.session.commit()
    log_audit_action(current_user.id, "LIBRARY_ADD_BOOK", "LIBRARY", f"Added book '{title}' ({book_code})")

    return jsonify({"message": "Book added successfully", "book": book.to_dict()}), 201

@library_bp.route("/loans", methods=["GET"])
@jwt_required()
def list_loans():
    status = request.args.get("status")
    query = BookLoan.query
    if status and status != "ALL":
        query = query.filter_by(status=status)
    loans = query.order_by(BookLoan.borrow_date.desc()).all()
    return jsonify({"loans": [l.to_dict() for l in loans]}), 200

@library_bp.route("/loans", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def issue_loan():
    current_user = get_current_user()
    data = request.get_json() or {}
    book_id = data.get("book_id")
    student_id = data.get("student_id")
    teacher_id = data.get("teacher_id")
    due_date_str = data.get("due_date")

    if not book_id or (not student_id and not teacher_id) or not due_date_str:
        return jsonify({"error": "Book, Borrower (Student or Teacher), and due date are required"}), 400

    book = LibraryBook.query.get_or_404(book_id)
    if book.available_copies < 1:
        return jsonify({"error": "No copies available for this book"}), 400

    due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    loan = BookLoan(
        book_id=book.id,
        student_id=student_id,
        teacher_id=teacher_id,
        borrow_date=date.today(),
        due_date=due_date,
        status="BORROWED",
        issued_by_id=current_user.id
    )
    book.available_copies -= 1
    db.session.add(loan)
    db.session.commit()
    log_audit_action(current_user.id, "LIBRARY_ISSUE_LOAN", "LIBRARY", f"Loaned book #{book.id} to borrower")

    return jsonify({"message": "Book issued successfully", "loan": loan.to_dict()}), 201

@library_bp.route("/loans/<int:loan_id>/return", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher", "teacher")
def return_loan(loan_id):
    current_user = get_current_user()
    loan = BookLoan.query.get_or_404(loan_id)
    if loan.status == "RETURNED":
        return jsonify({"error": "This loan was already returned"}), 400

    loan.return_date = date.today()
    loan.status = "RETURNED"
    if loan.book:
        loan.book.available_copies += 1

    # Check overdue days
    if loan.return_date > loan.due_date:
        overdue_days = (loan.return_date - loan.due_date).days
        loan.fine_amount = overdue_days * 2.0 # GH₵ 2.00 per day

    db.session.commit()
    log_audit_action(current_user.id, "LIBRARY_RETURN_LOAN", "LIBRARY", f"Returned loan #{loan.id}")

    return jsonify({"message": "Book returned successfully", "loan": loan.to_dict()}), 200
