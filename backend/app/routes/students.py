import io
import csv
from datetime import datetime, date
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from backend.app.models.base import db
from backend.app.models import (
    Student, Guardian, StudentGuardian, ClassLevel, Stream,
    Enrollment, AcademicYear, SchoolSetting
)
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

students_bp = Blueprint("students", __name__, url_prefix="/api/students")

def generate_admission_number():
    year_str = datetime.utcnow().strftime("%Y")
    count = Student.query.count() + 1
    while True:
        candidate = f"SCH/{year_str}/{count:04d}"
        if not Student.query.filter_by(admission_number=candidate).first():
            return candidate
        count += 1

@students_bp.route("", methods=["GET"])
@jwt_required()
def list_students():
    current_user = get_current_user()
    search = request.args.get("search", "").strip()
    class_id = request.args.get("class_id", type=int)
    stream_id = request.args.get("stream_id", type=int)
    status = request.args.get("status", "ACTIVE").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    query = Student.query

    # If student role, restrict to their own record
    if current_user and current_user.role and current_user.role.name == "student":
        if current_user.student_profile:
            query = query.filter(Student.id == current_user.student_profile.id)
        else:
            return jsonify({"students": [], "total": 0, "pages": 0}), 200

    # If parent role, restrict to their children
    if current_user and current_user.role and current_user.role.name == "parent":
        if current_user.guardian_profile:
            child_ids = [sg.student_id for sg in current_user.guardian_profile.students]
            query = query.filter(Student.id.in_(child_ids))
        else:
            return jsonify({"students": [], "total": 0, "pages": 0}), 200

    if status and status != "ALL":
        query = query.filter(Student.status == status)

    if class_id:
        query = query.filter(Student.current_class_id == class_id)

    if stream_id:
        query = query.filter(Student.current_stream_id == stream_id)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Student.first_name.ilike(search_fmt)) |
            (Student.last_name.ilike(search_fmt)) |
            (Student.other_names.ilike(search_fmt)) |
            (Student.admission_number.ilike(search_fmt))
        )

    pagination = query.order_by(Student.last_name.asc()).paginate(page=page, per_page=per_page, error_out=False)
    
    can_view_sensitive = current_user and (current_user.role.name in ["super_admin", "headteacher", "teacher"])

    return jsonify({
        "students": [s.to_dict(include_sensitive=can_view_sensitive) for s in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200

@students_bp.route("/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student(student_id):
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)

    can_view_sensitive = current_user and (current_user.role.name in ["super_admin", "headteacher", "teacher"])
    data = student.to_dict(include_sensitive=can_view_sensitive)
    
    # Include enrollments history
    data["enrollment_history"] = [e.to_dict() for e in student.enrollments]
    return jsonify({"student": data}), 200

@students_bp.route("", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def create_student():
    current_user = get_current_user()
    data = request.get_json() or {}

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    other_names = data.get("other_names", "").strip()
    gender = data.get("gender", "").strip()
    dob_str = data.get("date_of_birth", "")
    residential_address = data.get("residential_address", "").strip()
    current_class_id = data.get("current_class_id")
    current_stream_id = data.get("current_stream_id")

    if not first_name or not last_name or not gender or not dob_str or not current_class_id:
        return jsonify({"error": "First name, last name, gender, date of birth, and class are required"}), 400

    admission_number = data.get("admission_number", "").strip()
    if not admission_number:
        admission_number = generate_admission_number()
    else:
        existing = Student.query.filter_by(admission_number=admission_number).first()
        if existing:
            return jsonify({"error": f"Admission number {admission_number} already in use"}), 400

    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date of birth format. Use YYYY-MM-DD"}), 400

    adm_date_str = data.get("admission_date")
    adm_date = datetime.strptime(adm_date_str, "%Y-%m-%d").date() if adm_date_str else date.today()

    student = Student(
        admission_number=admission_number,
        first_name=first_name,
        last_name=last_name,
        other_names=other_names if other_names else None,
        gender=gender,
        date_of_birth=dob,
        admission_date=adm_date,
        residential_address=residential_address,
        previous_school=data.get("previous_school"),
        medical_info=data.get("medical_info"),
        emergency_contact_name=data.get("emergency_contact_name", "Primary Guardian"),
        emergency_contact_phone=data.get("emergency_contact_phone", "+233 24 000 0000"),
        status="ACTIVE",
        current_class_id=current_class_id,
        current_stream_id=current_stream_id
    )
    db.session.add(student)
    db.session.flush()

    # Create / Link Guardian if provided
    guardian_name = data.get("guardian_name", "").strip()
    guardian_phone = data.get("guardian_phone", "").strip()
    if guardian_name and guardian_phone:
        guardian = Guardian(
            full_name=guardian_name,
            phone=guardian_phone,
            alt_phone=data.get("guardian_alt_phone"),
            email=data.get("guardian_email"),
            occupation=data.get("guardian_occupation"),
            residential_address=residential_address
        )
        db.session.add(guardian)
        db.session.flush()

        sg = StudentGuardian(
            student_id=student.id,
            guardian_id=guardian.id,
            relationship_type=data.get("guardian_relationship", "Parent"),
            is_primary=True
        )
        db.session.add(sg)

    # Record Initial Enrollment in current academic year
    current_year = AcademicYear.query.filter_by(is_current=True).first()
    if current_year:
        enr = Enrollment(
            student_id=student.id,
            academic_year_id=current_year.id,
            class_level_id=current_class_id,
            stream_id=current_stream_id,
            status="ENROLLED"
        )
        db.session.add(enr)

    db.session.commit()
    log_audit_action(current_user.id, "STUDENT_REGISTER", "STUDENTS", f"Registered student {student.full_name} ({student.admission_number})")

    return jsonify({
        "message": "Student registered successfully",
        "student": student.to_dict(include_sensitive=True)
    }), 201

@students_bp.route("/<int:student_id>", methods=["PUT"])
@jwt_required()
@role_required("super_admin", "headteacher")
def update_student(student_id):
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)
    data = request.get_json() or {}

    fields = [
        "first_name", "last_name", "other_names", "gender",
        "residential_address", "previous_school", "medical_info",
        "emergency_contact_name", "emergency_contact_phone", "status",
        "current_class_id", "current_stream_id"
    ]
    for f in fields:
        if f in data:
            setattr(student, f, data[f])

    if "date_of_birth" in data and data["date_of_birth"]:
        try:
            student.date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
        except ValueError:
            pass

    db.session.commit()
    log_audit_action(current_user.id, "STUDENT_UPDATE", "STUDENTS", f"Updated student profile {student.admission_number}")

    return jsonify({
        "message": "Student profile updated successfully",
        "student": student.to_dict(include_sensitive=True)
    }), 200

@students_bp.route("/<int:student_id>/promote", methods=["POST"])
@jwt_required()
@role_required("super_admin", "headteacher")
def promote_student(student_id):
    current_user = get_current_user()
    student = Student.query.get_or_404(student_id)
    data = request.get_json() or {}

    target_class_id = data.get("target_class_id")
    target_stream_id = data.get("target_stream_id")
    academic_year_id = data.get("academic_year_id")

    if not target_class_id:
        return jsonify({"error": "Target class is required"}), 400

    target_class = ClassLevel.query.get_or_404(target_class_id)
    prev_class_name = student.current_class.name if student.current_class else ""

    student.current_class_id = target_class_id
    student.current_stream_id = target_stream_id

    # Create promotion enrollment record
    if academic_year_id:
        enr = Enrollment(
            student_id=student.id,
            academic_year_id=academic_year_id,
            class_level_id=target_class_id,
            stream_id=target_stream_id,
            status="PROMOTED"
        )
        db.session.add(enr)

    db.session.commit()
    log_audit_action(
        current_user.id, "STUDENT_PROMOTE", "STUDENTS",
        f"Promoted {student.full_name} ({student.admission_number}) from {prev_class_name} to {target_class.name}"
    )

    return jsonify({
        "message": f"Student promoted to {target_class.name} successfully",
        "student": student.to_dict()
    }), 200

@students_bp.route("/<int:student_id>/biodata-pdf", methods=["GET"])
@jwt_required()
def download_biodata_pdf(student_id):
    student = Student.query.get_or_404(student_id)
    school = SchoolSetting.query.first()
    school_name = school.school_name if school else "Charity Preparatory School"
    school_motto = school.school_motto if school else "Knowledge, Discipline, and Excellence"
    school_address = school.address if school else "P.O. Box CP 120, Accra, Ghana"
    school_phone = school.phone if school else "+233 24 412 3456"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("BTitle", parent=styles["Heading1"], alignment=1, fontSize=16, textColor=colors.HexColor("#1E3A8A"))
    sub_style = ParagraphStyle("BSub", parent=styles["Normal"], alignment=1, fontSize=9, textColor=colors.HexColor("#4B5563"))
    head_style = ParagraphStyle("BHead", parent=styles["Heading2"], alignment=1, fontSize=13, textColor=colors.HexColor("#D97706"))
    lbl = ParagraphStyle("Lbl", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#1E3A8A"))
    val = ParagraphStyle("Val", fontName="Helvetica", fontSize=9)

    story = [
        Paragraph(school_name, title_style),
        Paragraph(f"<i>&ldquo;{school_motto}&rdquo;</i>", sub_style),
        Paragraph(f"{school_address} | Tel: {school_phone}", sub_style),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceBefore=2, spaceAfter=8),
        Paragraph("OFFICIAL STUDENT BIODATA FORM", head_style),
        Spacer(1, 12)
    ]

    primary_guardian = student.guardians[0].guardian if student.guardians else None

    table_data = [
        [Paragraph("<b>Admission Number:</b>", lbl), Paragraph(student.admission_number, val), Paragraph("<b>Status:</b>", lbl), Paragraph(student.status, val)],
        [Paragraph("<b>Full Name:</b>", lbl), Paragraph(student.full_name, val), Paragraph("<b>Gender:</b>", lbl), Paragraph(student.gender, val)],
        [Paragraph("<b>Date of Birth:</b>", lbl), Paragraph(str(student.date_of_birth), val), Paragraph("<b>Admission Date:</b>", lbl), Paragraph(str(student.admission_date), val)],
        [Paragraph("<b>Current Class:</b>", lbl), Paragraph(student.current_class.name if student.current_class else "", val), Paragraph("<b>Stream:</b>", lbl), Paragraph(student.current_stream.name if student.current_stream else "", val)],
        [Paragraph("<b>Residential Address:</b>", lbl), Paragraph(student.residential_address, val), Paragraph("<b>Previous School:</b>", lbl), Paragraph(student.previous_school or "N/A", val)],
        [Paragraph("<b>Primary Guardian:</b>", lbl), Paragraph(primary_guardian.full_name if primary_guardian else "N/A", val), Paragraph("<b>Guardian Phone:</b>", lbl), Paragraph(primary_guardian.phone if primary_guardian else "N/A", val)],
        [Paragraph("<b>Emergency Contact:</b>", lbl), Paragraph(student.emergency_contact_name, val), Paragraph("<b>Emergency Phone:</b>", lbl), Paragraph(student.emergency_contact_phone, val)],
        [Paragraph("<b>Medical / Dietary Notes:</b>", lbl), Paragraph(student.medical_info or "None recorded", val), Paragraph("", lbl), Paragraph("", val)],
    ]

    t = Table(table_data, colWidths=[1.8*inch, 2.2*inch, 1.6*inch, 2.0*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 30))

    sig_data = [
        [
            Paragraph("____________________________<br/>Parent / Guardian Signature", sub_style),
            Paragraph("____________________________<br/>Headteacher's Signature & Stamp", sub_style)
        ]
    ]
    sig_t = Table(sig_data, colWidths=[3.7*inch, 3.8*inch])
    story.append(sig_t)

    doc.build(story)
    buffer.seek(0)
    return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name=f"biodata_{student.admission_number.replace('/', '_')}.pdf")

@students_bp.route("/export", methods=["GET"])
@jwt_required()
@role_required("super_admin", "headteacher")
def export_students_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Admission Number", "First Name", "Last Name", "Other Names",
        "Gender", "Date of Birth", "Admission Date", "Class", "Stream",
        "Residential Address", "Emergency Contact", "Emergency Phone", "Status"
    ])

    students = Student.query.order_by(Student.admission_number.asc()).all()
    for s in students:
        writer.writerow([
            s.admission_number, s.first_name, s.last_name, s.other_names or "",
            s.gender, str(s.date_of_birth), str(s.admission_date),
            s.current_class.name if s.current_class else "",
            s.current_stream.name if s.current_stream else "",
            s.residential_address, s.emergency_contact_name, s.emergency_contact_phone, s.status
        ])

    mem = io.BytesIO()
    mem.write(output.getvalue().encode("utf-8"))
    mem.seek(0)

    return send_file(mem, mimetype="text/csv", as_attachment=True, download_name=f"students_export_{date.today().isoformat()}.csv")
