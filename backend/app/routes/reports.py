import io
import csv
from datetime import datetime, date
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from backend.app.models.base import db
from backend.app.models import (
    Student, ClassLevel, Attendance, AssessmentScore, Assessment, Invoice, Payment,
    Expense, Teacher, Staff, LibraryBook, SchoolAsset
)
from backend.app.utils.auth_middleware import get_current_user, role_required

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@reports_bp.route("/enrollment-summary", methods=["GET"])
@jwt_required()
def get_enrollment_summary():
    classes = ClassLevel.query.order_by(ClassLevel.order_index.asc()).all()
    res = []
    total_male = 0
    total_female = 0

    for cl in classes:
        male_cnt = Student.query.filter_by(current_class_id=cl.id, gender="Male", status="ACTIVE").count()
        fem_cnt = Student.query.filter_by(current_class_id=cl.id, gender="Female", status="ACTIVE").count()
        tot = male_cnt + fem_cnt
        total_male += male_cnt
        total_female += fem_cnt
        res.append({
            "class_name": cl.name,
            "code": cl.code,
            "level_group": cl.level_group,
            "male": male_cnt,
            "female": fem_cnt,
            "total": tot,
            "capacity": cl.capacity
        })

    return jsonify({
        "classes": res,
        "grand_total": total_male + total_female,
        "total_male": total_male,
        "total_female": total_female
    }), 200

@reports_bp.route("/fee-collection-summary", methods=["GET"])
@jwt_required()
@role_required("super_admin", "accountant", "headteacher")
def get_fee_collection_summary():
    classes = ClassLevel.query.order_by(ClassLevel.order_index.asc()).all()
    summary = []
    total_billed = 0.0
    total_received = 0.0
    total_pending = 0.0

    for cl in classes:
        billed = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0.0))\
            .join(Student, Student.id == Invoice.student_id)\
            .filter(Student.current_class_id == cl.id).scalar()
        received = db.session.query(func.coalesce(func.sum(Payment.amount), 0.0))\
            .join(Student, Student.id == Payment.student_id)\
            .filter(Student.current_class_id == cl.id, Payment.status == "CONFIRMED").scalar()
        balance = float(billed) - float(received)
        rate = round((float(received) / float(billed) * 100), 1) if float(billed) > 0 else 100.0

        total_billed += float(billed)
        total_received += float(received)
        total_pending += max(0.0, balance)

        summary.append({
            "class_name": cl.name,
            "billed": float(billed),
            "received": float(received),
            "balance": max(0.0, balance),
            "recovery_rate": rate
        })

    return jsonify({
        "classes": summary,
        "total_billed": total_billed,
        "total_received": total_received,
        "total_pending": total_pending,
        "overall_recovery_rate": round((total_received / total_billed * 100), 1) if total_billed > 0 else 100.0
    }), 200

@reports_bp.route("/export-financial-csv", methods=["GET"])
@jwt_required()
@role_required("super_admin", "accountant", "headteacher")
def export_financial_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Class Name", "Total Billed (GH₵)", "Total Collected (GH₵)", "Outstanding Balance (GH₵)", "Recovery Rate (%)"])

    classes = ClassLevel.query.order_by(ClassLevel.order_index.asc()).all()
    for cl in classes:
        billed = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0.0))\
            .join(Student, Student.id == Invoice.student_id)\
            .filter(Student.current_class_id == cl.id).scalar()
        received = db.session.query(func.coalesce(func.sum(Payment.amount), 0.0))\
            .join(Student, Student.id == Payment.student_id)\
            .filter(Student.current_class_id == cl.id, Payment.status == "CONFIRMED").scalar()
        bal = max(0.0, float(billed) - float(received))
        rate = round((float(received) / float(billed) * 100), 1) if float(billed) > 0 else 100.0
        writer.writerow([cl.name, f"{float(billed):.2f}", f"{float(received):.2f}", f"{bal:.2f}", f"{rate:.1f}%"])

    mem = io.BytesIO()
    mem.write(output.getvalue().encode("utf-8"))
    mem.seek(0)
    return send_file(mem, mimetype="text/csv", as_attachment=True, download_name=f"fee_recovery_{date.today().isoformat()}.csv")
