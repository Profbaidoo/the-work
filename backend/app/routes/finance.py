import io
from datetime import datetime, date
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from backend.app.models.base import db
from backend.app.models import (
    FeeStructure, Invoice, Payment, Expense, Student, AcademicYear, Term, ClassLevel, SchoolSetting
)
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.pdf_generator import generate_payment_receipt_pdf
from backend.app.utils.audit import log_audit_action

finance_bp = Blueprint("finance", __name__, url_prefix="/api/finance")

def generate_receipt_number():
    year_str = datetime.utcnow().strftime("%Y")
    count = Payment.query.count() + 1
    while True:
        candidate = f"RCP-{year_str}-{count:04d}"
        if not Payment.query.filter_by(reference_number=candidate).first():
            return candidate
        count += 1

# Fee Structures
@finance_bp.route("/fee-structures", methods=["GET"])
@jwt_required()
def list_fee_structures():
    term_id = request.args.get("term_id", type=int)
    year_id = request.args.get("year_id", type=int)
    class_id = request.args.get("class_id", type=int)

    query = FeeStructure.query
    if term_id:
        query = query.filter_by(term_id=term_id)
    if year_id:
        query = query.filter_by(academic_year_id=year_id)
    if class_id:
        query = query.filter((FeeStructure.class_level_id == class_id) | (FeeStructure.class_level_id == None))

    items = query.all()
    return jsonify({"fee_structures": [f.to_dict() for f in items]}), 200

@finance_bp.route("/fee-structures", methods=["POST"])
@jwt_required()
@role_required("super_admin", "accountant")
def create_fee_structure():
    current_user = get_current_user()
    data = request.get_json() or {}
    academic_year_id = data.get("academic_year_id")
    term_id = data.get("term_id")
    class_level_id = data.get("class_level_id")
    title = data.get("title", "").strip()
    amount = float(data.get("amount", 0.0))
    is_mandatory = data.get("is_mandatory", True)
    description = data.get("description")

    if not academic_year_id or not term_id or not title or amount <= 0:
        return jsonify({"error": "Academic year, term, title, and valid positive amount are required"}), 400

    fs = FeeStructure(
        academic_year_id=academic_year_id,
        term_id=term_id,
        class_level_id=class_level_id,
        title=title,
        amount=amount,
        is_mandatory=is_mandatory,
        description=description
    )
    db.session.add(fs)
    db.session.commit()
    log_audit_action(current_user.id, "FEE_STRUCTURE_CREATE", "FINANCE", f"Created fee structure '{title}' GH₵ {amount:.2f}")

    return jsonify({"message": "Fee structure item created", "fee_structure": fs.to_dict()}), 201

# Invoices
@finance_bp.route("/invoices", methods=["GET"])
@jwt_required()
def list_invoices():
    current_user = get_current_user()
    student_id = request.args.get("student_id", type=int)
    term_id = request.args.get("term_id", type=int)
    status = request.args.get("status")

    query = Invoice.query

    # Restrict parent/student
    if current_user and current_user.role and current_user.role.name == "student":
        if current_user.student_profile:
            query = query.filter(Invoice.student_id == current_user.student_profile.id)
        else:
            return jsonify({"invoices": []}), 200

    if current_user and current_user.role and current_user.role.name == "parent":
        if current_user.guardian_profile:
            cids = [sg.student_id for sg in current_user.guardian_profile.students]
            query = query.filter(Invoice.student_id.in_(cids))
        else:
            return jsonify({"invoices": []}), 200

    if student_id:
        query = query.filter(Invoice.student_id == student_id)
    if term_id:
        query = query.filter(Invoice.term_id == term_id)
    if status and status != "ALL":
        query = query.filter(Invoice.status == status)

    invoices = query.order_by(Invoice.created_at.desc()).all()
    return jsonify({"invoices": [inv.to_dict() for inv in invoices]}), 200

@finance_bp.route("/invoices/batch-generate", methods=["POST"])
@jwt_required()
@role_required("super_admin", "accountant")
def batch_generate_invoices():
    """
    Generates terminal invoices for all enrolled students based on active fee structures.
    """
    current_user = get_current_user()
    data = request.get_json() or {}
    academic_year_id = data.get("academic_year_id")
    term_id = data.get("term_id")
    due_date_str = data.get("due_date")

    if not academic_year_id or not term_id:
        return jsonify({"error": "academic_year_id and term_id are required"}), 400

    due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date() if due_date_str else date.today()

    students = Student.query.filter_by(status="ACTIVE").all()
    created_count = 0

    for st in students:
        # Check if invoice already exists
        existing = Invoice.query.filter_by(student_id=st.id, term_id=term_id).first()
        if existing:
            continue

        # Calculate applicable fee structures
        fee_items = FeeStructure.query.filter(
            FeeStructure.academic_year_id == academic_year_id,
            FeeStructure.term_id == term_id,
            (FeeStructure.class_level_id == st.current_class_id) | (FeeStructure.class_level_id == None),
            FeeStructure.is_mandatory == True
        ).all()

        total_fee = sum(f.amount for f in fee_items)
        if total_fee <= 0:
            total_fee = 1000.0 # Default basic fee if unconfigured

        inv_num = f"INV-{datetime.utcnow().strftime('%Y')}-{st.id:04d}-{term_id}"
        inv = Invoice(
            student_id=st.id,
            academic_year_id=academic_year_id,
            term_id=term_id,
            invoice_number=inv_num,
            total_amount=total_fee,
            discount_amount=0.0,
            paid_amount=0.0,
            balance_due=total_fee,
            status="UNPAID",
            due_date=due_date
        )
        db.session.add(inv)
        created_count += 1

    db.session.commit()
    log_audit_action(current_user.id, "INVOICE_BATCH_GENERATE", "FINANCE", f"Batch generated {created_count} student invoices")

    return jsonify({"message": f"Successfully generated {created_count} student invoices"}), 200

# Payments
@finance_bp.route("/payments", methods=["GET"])
@jwt_required()
def list_payments():
    current_user = get_current_user()
    student_id = request.args.get("student_id", type=int)
    invoice_id = request.args.get("invoice_id", type=int)

    query = Payment.query

    if current_user and current_user.role and current_user.role.name == "student":
        if current_user.student_profile:
            query = query.filter(Payment.student_id == current_user.student_profile.id)
        else:
            return jsonify({"payments": []}), 200

    if current_user and current_user.role and current_user.role.name == "parent":
        if current_user.guardian_profile:
            cids = [sg.student_id for sg in current_user.guardian_profile.students]
            query = query.filter(Payment.student_id.in_(cids))
        else:
            return jsonify({"payments": []}), 200

    if student_id:
        query = query.filter(Payment.student_id == student_id)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    payments = query.order_by(Payment.created_at.desc()).all()
    return jsonify({"payments": [p.to_dict() for p in payments]}), 200

@finance_bp.route("/payments", methods=["POST"])
@jwt_required()
@role_required("super_admin", "accountant")
def record_payment():
    """
    Records an authorized fee payment in Ghana Cedis and recalculates invoice balances.
    """
    current_user = get_current_user()
    data = request.get_json() or {}
    invoice_id = data.get("invoice_id")
    amount = float(data.get("amount", 0.0))
    payment_method = data.get("payment_method", "CASH")
    payment_date_str = data.get("payment_date")
    ext_tx_id = data.get("external_transaction_id")
    notes = data.get("notes")

    if not invoice_id or amount <= 0:
        return jsonify({"error": "Invoice ID and a positive payment amount are required"}), 400

    invoice = Invoice.query.get_or_404(invoice_id)
    pay_date = datetime.strptime(payment_date_str, "%Y-%m-%d").date() if payment_date_str else date.today()
    ref_num = generate_receipt_number()

    payment = Payment(
        invoice_id=invoice.id,
        student_id=invoice.student_id,
        reference_number=ref_num,
        amount=amount,
        payment_method=payment_method,
        external_transaction_id=ext_tx_id,
        payment_date=pay_date,
        status="CONFIRMED",
        notes=notes,
        recorded_by_id=current_user.id
    )
    db.session.add(payment)
    db.session.flush()

    # Recalculate invoice status & balance
    invoice.recalculate_balance()
    db.session.commit()

    log_audit_action(
        current_user.id, "PAYMENT_RECORD", "FINANCE",
        f"Recorded payment {ref_num} of GH₵ {amount:.2f} for student #{invoice.student_id}"
    )

    return jsonify({
        "message": "Payment recorded successfully",
        "payment": payment.to_dict(),
        "invoice": invoice.to_dict()
    }), 201

@finance_bp.route("/payments/<int:payment_id>/receipt-pdf", methods=["GET"])
@jwt_required()
def download_payment_receipt(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    school = SchoolSetting.query.first()

    school_info = {
        "name": school.school_name if school else "Achimota Royal Basic Academy",
        "address": school.address if school else "P.O. Box AC 48, Achimota - Accra, Ghana",
        "phone": school.phone if school else "+233 24 412 3456"
    }

    payment_info = {
        "reference_number": payment.reference_number,
        "payment_date": payment.payment_date,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "balance_due": payment.invoice.balance_due if payment.invoice else 0.0,
        "notes": payment.notes or "Official fee payment acknowledgment",
        "cashier_name": payment.recorded_by.full_name if payment.recorded_by else "Bursar"
    }

    student_info = {
        "full_name": payment.student.full_name,
        "admission_number": payment.student.admission_number,
        "class_name": payment.student.current_class.name if payment.student.current_class else "",
        "stream_name": payment.student.current_stream.name if payment.student.current_stream else ""
    }

    pdf_bytes = generate_payment_receipt_pdf(school_info, payment_info, student_info)
    mem = io.BytesIO(pdf_bytes)
    mem.seek(0)

    filename = f"receipt_{payment.reference_number}.pdf"
    return send_file(mem, mimetype="application/pdf", as_attachment=True, download_name=filename)

# Expenses
@finance_bp.route("/expenses", methods=["GET"])
@jwt_required()
def list_expenses():
    category = request.args.get("category")
    status = request.args.get("status")

    query = Expense.query
    if category and category != "ALL":
        query = query.filter_by(category=category)
    if status and status != "ALL":
        query = query.filter_by(status=status)

    expenses = query.order_by(Expense.expense_date.desc()).all()
    return jsonify({"expenses": [e.to_dict() for e in expenses]}), 200

@finance_bp.route("/expenses", methods=["POST"])
@jwt_required()
@role_required("super_admin", "accountant", "headteacher")
def create_expense():
    current_user = get_current_user()
    data = request.get_json() or {}
    category = data.get("category", "SUPPLIES")
    title = data.get("title", "").strip()
    amount = float(data.get("amount", 0.0))
    expense_date_str = data.get("expense_date")
    paid_to = data.get("paid_to", "").strip()
    receipt_reference = data.get("receipt_reference")
    notes = data.get("notes")

    if not title or amount <= 0 or not paid_to:
        return jsonify({"error": "Title, positive amount, and recipient (paid to) are required"}), 400

    exp_date = datetime.strptime(expense_date_str, "%Y-%m-%d").date() if expense_date_str else date.today()

    exp = Expense(
        category=category,
        title=title,
        amount=amount,
        expense_date=exp_date,
        paid_to=paid_to,
        receipt_reference=receipt_reference,
        notes=notes,
        status="APPROVED" if current_user.role.name in ["super_admin", "headteacher"] else "PENDING",
        recorded_by_id=current_user.id,
        approved_by_id=current_user.id if current_user.role.name in ["super_admin", "headteacher"] else None
    )
    db.session.add(exp)
    db.session.commit()
    log_audit_action(current_user.id, "EXPENSE_CREATE", "FINANCE", f"Recorded expense '{title}' GH₵ {amount:.2f}")

    return jsonify({"message": "Expense recorded successfully", "expense": exp.to_dict()}), 201

# Financial Summary Statement
@finance_bp.route("/summary", methods=["GET"])
@jwt_required()
@role_required("super_admin", "accountant", "headteacher")
def get_financial_summary():
    total_invoiced = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0.0)).scalar()
    total_collected = db.session.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(Payment.status == "CONFIRMED").scalar()
    total_outstanding = db.session.query(func.coalesce(func.sum(Invoice.balance_due), 0.0)).scalar()
    total_expenses = db.session.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(Expense.status == "APPROVED").scalar()

    net_balance = float(total_collected) - float(total_expenses)

    # Class-by-class collection rates
    classes = ClassLevel.query.order_by(ClassLevel.order_index.asc()).all()
    class_recovery = []
    for cl in classes:
        invoiced = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0.0))\
            .join(Student, Student.id == Invoice.student_id)\
            .filter(Student.current_class_id == cl.id).scalar()
        collected = db.session.query(func.coalesce(func.sum(Payment.amount), 0.0))\
            .join(Student, Student.id == Payment.student_id)\
            .filter(Student.current_class_id == cl.id, Payment.status == "CONFIRMED").scalar()
        outstanding = float(invoiced) - float(collected)
        pct = round((float(collected) / float(invoiced) * 100), 1) if float(invoiced) > 0 else 100.0
        class_recovery.append({
            "class_name": cl.name,
            "invoiced": float(invoiced),
            "collected": float(collected),
            "outstanding": max(0.0, outstanding),
            "recovery_rate": pct
        })

    return jsonify({
        "total_invoiced": float(total_invoiced),
        "total_collected": float(total_collected),
        "total_outstanding": float(total_outstanding),
        "total_expenses": float(total_expenses),
        "net_operating_balance": net_balance,
        "class_recovery": class_recovery
    }), 200
