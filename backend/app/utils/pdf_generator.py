import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_report_card_pdf(school_info, student_info, term_info, academic_scores, summary_info):
    """
    Generates a professional Ghanaian Basic School terminal report card PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "SchoolTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=colors.HexColor("#1E3A8A") # Navy Blue
    )
    motto_style = ParagraphStyle(
        "SchoolMotto",
        parent=styles["Italic"],
        fontSize=10,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#4B5563")
    )
    header_style = ParagraphStyle(
        "SchoolHeader",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor("#1F2937")
    )
    report_title = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#D97706") # Gold/Amber accent
    )
    label_style = ParagraphStyle(
        "LabelStyle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#1E3A8A")
    )
    val_style = ParagraphStyle(
        "ValStyle",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        textColor=colors.black
    )

    story = []

    # School Header
    story.append(Paragraph(school_info.get("name", "ACHIMOTA ROYAL BASIC ACADEMY"), title_style))
    story.append(Paragraph(f"<i>&ldquo;{school_info.get('motto', 'Knowledge, Discipline, and Excellence')}&rdquo;</i>", motto_style))
    story.append(Paragraph(f"{school_info.get('address', 'P.O. Box AC 48, Achimota - Accra, Ghana')} | Tel: {school_info.get('phone', '+233 24 412 3456')}", header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceBefore=2, spaceAfter=8))
    
    # Report Title
    story.append(Paragraph(f"STUDENT TERMINAL PROGRESS REPORT &mdash; {term_info.get('term_name', 'TERM 1').upper()} ({term_info.get('academic_year', '2025/2026')})", report_title))
    story.append(Spacer(1, 8))

    # Student Biodata Table
    student_table_data = [
        [
            Paragraph("<b>Student Full Name:</b>", label_style),
            Paragraph(student_info.get("full_name", ""), val_style),
            Paragraph("<b>Admission No:</b>", label_style),
            Paragraph(student_info.get("admission_number", ""), val_style)
        ],
        [
            Paragraph("<b>Class / Stream:</b>", label_style),
            Paragraph(f"{student_info.get('class_name', '')} {student_info.get('stream_name', '')}".strip(), val_style),
            Paragraph("<b>Gender:</b>", label_style),
            Paragraph(student_info.get("gender", ""), val_style)
        ],
        [
            Paragraph("<b>Total Attendance:</b>", label_style),
            Paragraph(f"{summary_info.get('attendance_present', 0)} / {summary_info.get('attendance_total', 0)} days", val_style),
            Paragraph("<b>Class Position:</b>", label_style),
            Paragraph(f"{summary_info.get('position', '-')} of {summary_info.get('total_students', '-')}", val_style)
        ]
    ]
    student_table = Table(student_table_data, colWidths=[1.5*inch, 2.3*inch, 1.4*inch, 2.0*inch])
    student_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(student_table)
    story.append(Spacer(1, 12))

    # Academic Performance Table
    # Columns: Subject, Class Score (30%), Exam Score (70%), Total (100%), Grade, Remarks
    score_table_data = [
        [
            Paragraph("<b>SUBJECT</b>", label_style),
            Paragraph("<b>CLASS SCORE (30%)</b>", label_style),
            Paragraph("<b>EXAM (70%)</b>", label_style),
            Paragraph("<b>TOTAL (100%)</b>", label_style),
            Paragraph("<b>GRADE</b>", label_style),
            Paragraph("<b>REMARKS</b>", label_style)
        ]
    ]

    for item in academic_scores:
        score_table_data.append([
            Paragraph(item.get("subject", ""), val_style),
            Paragraph(f"{item.get('class_score', 0):.1f}", val_style),
            Paragraph(f"{item.get('exam_score', 0):.1f}", val_style),
            Paragraph(f"<b>{item.get('total_score', 0):.1f}</b>", val_style),
            Paragraph(f"<b>{item.get('grade', '-')}</b>", val_style),
            Paragraph(item.get("remarks", ""), val_style),
        ])

    score_table = Table(score_table_data, colWidths=[2.3*inch, 1.2*inch, 1.1*inch, 1.0*inch, 0.7*inch, 1.4*inch])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (4, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F1F5F9")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 10))

    # Performance Summary Row
    summary_data = [
        [
            Paragraph(f"<b>Overall Total Marks:</b> {summary_info.get('total_marks', 0):.1f}", label_style),
            Paragraph(f"<b>Term Average:</b> {summary_info.get('average', 0):.1f}%", label_style),
            Paragraph(f"<b>Overall Grade:</b> {summary_info.get('overall_grade', '-')}", label_style),
            Paragraph(f"<b>Promotion Status:</b> {summary_info.get('promotion_status', 'Pending')}", label_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[1.8*inch, 1.8*inch, 1.8*inch, 1.8*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")), # Light amber
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#D97706")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#FDE68A")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 12))

    # Remarks & Signatures Section
    remarks_data = [
        [
            Paragraph("<b>Class Teacher's Remarks:</b>", label_style),
            Paragraph(summary_info.get("class_teacher_remarks", "A diligent and hardworking student with great potential."), val_style)
        ],
        [
            Paragraph("<b>Headteacher's Comments:</b>", label_style),
            Paragraph(summary_info.get("headteacher_remarks", "Satisfactory terminal performance. Encouraged to maintain consistency in core subjects."), val_style)
        ]
    ]
    remarks_table = Table(remarks_data, colWidths=[2.0*inch, 5.2*inch])
    remarks_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(remarks_table)
    story.append(Spacer(1, 20))

    # Signature lines
    sig_data = [
        [
            Paragraph("____________________________<br/><b>Class Teacher's Signature</b>", header_style),
            Paragraph(f"<b>Next Term Begins:</b><br/>{term_info.get('next_term_begins', '12th September, 2026')}", header_style),
            Paragraph("____________________________<br/><b>Headteacher's Signature & Stamp</b>", header_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[2.4*inch, 2.4*inch, 2.4*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_payment_receipt_pdf(school_info, payment_info, student_info):
    """
    Generates an official fee payment receipt in Ghana Cedis (GH₵).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReceiptSchoolTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        alignment=1,
        textColor=colors.HexColor("#1E3A8A")
    )
    subtitle_style = ParagraphStyle(
        "ReceiptSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor("#4B5563")
    )
    rec_title = ParagraphStyle(
        "RecTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#0D9488") # Teal accent
    )
    label_style = ParagraphStyle("Lbl", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#1E3A8A"))
    val_style = ParagraphStyle("Val", fontName="Helvetica", fontSize=9, textColor=colors.black)

    story = []
    story.append(Paragraph(school_info.get("name", "ACHIMOTA ROYAL BASIC ACADEMY"), title_style))
    story.append(Paragraph(f"{school_info.get('address', 'Accra, Ghana')} | Tel: {school_info.get('phone', '+233 24 412 3456')}", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0D9488"), spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph("OFFICIAL FEE PAYMENT RECEIPT", rec_title))
    story.append(Spacer(1, 10))

    receipt_details = [
        [
            Paragraph("<b>Receipt Reference:</b>", label_style),
            Paragraph(f"<b>{payment_info.get('reference_number', 'RCP-0000')}</b>", val_style),
            Paragraph("<b>Payment Date:</b>", label_style),
            Paragraph(str(payment_info.get("payment_date", datetime.utcnow().strftime("%Y-%m-%d"))), val_style)
        ],
        [
            Paragraph("<b>Student Name:</b>", label_style),
            Paragraph(student_info.get("full_name", ""), val_style),
            Paragraph("<b>Admission No:</b>", label_style),
            Paragraph(student_info.get("admission_number", ""), val_style)
        ],
        [
            Paragraph("<b>Class / Stream:</b>", label_style),
            Paragraph(f"{student_info.get('class_name', '')} {student_info.get('stream_name', '')}".strip(), val_style),
            Paragraph("<b>Payment Method:</b>", label_style),
            Paragraph(payment_info.get("payment_method", "Cash").replace("_", " "), val_style)
        ],
        [
            Paragraph("<b>Amount Paid:</b>", label_style),
            Paragraph(f"<font color='#0D9488' size='11'><b>GH₵ {payment_info.get('amount', 0.0):,.2f}</b></font>", val_style),
            Paragraph("<b>Outstanding Balance:</b>", label_style),
            Paragraph(f"<font color='#DC2626'><b>GH₵ {payment_info.get('balance_due', 0.0):,.2f}</b></font>", val_style)
        ]
    ]

    table = Table(receipt_details, colWidths=[1.6*inch, 2.2*inch, 1.5*inch, 2.0*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 15))

    note_data = [
        [Paragraph(f"<b>Remarks / Note:</b> {payment_info.get('notes', 'Payment received in full and credited to terminal account.')}", val_style)]
    ]
    note_table = Table(note_data, colWidths=[7.3*inch])
    note_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(note_table)
    story.append(Spacer(1, 30))

    sig_data = [
        [
            Paragraph(f"Issued By: <b>{payment_info.get('cashier_name', 'Bursar')}</b>", val_style),
            Paragraph("Authorized Signature & Stamp: __________________________", val_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[3.6*inch, 3.7*inch])
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
