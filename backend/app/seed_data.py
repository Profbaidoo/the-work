from datetime import date, datetime, timedelta
from backend.app.models.base import db
from backend.app.models import (
    User, Role, Permission, role_permissions,
    AcademicYear, Term, ClassLevel, Stream, Subject, ClassSubject, TeacherAssignment,
    Teacher, Staff, StaffAttendance,
    Student, Guardian, StudentGuardian, Enrollment,
    Attendance, GradingScale, Assessment, AssessmentScore, ReportCard,
    FeeStructure, Invoice, Payment, PaymentAllocation, Expense,
    TimetableSlot, SchoolCalendarEvent, Announcement, Notification,
    LibraryBook, BookLoan, SchoolAsset, SchoolSetting
)

def seed_database():
    """
    Seeds initial and realistic demonstration data for a Ghanaian Basic School.
    Safe to run idempotently (checks if already seeded).
    """
    if Role.query.first():
        print("[Seed] Database already seeded. Skipping initial seed.")
        return

    print("[Seed] Seeding database with Ghanaian Basic School structure and demo data...")

    # 1. Roles
    roles_data = [
        {"name": "super_admin", "display_name": "Super Administrator", "description": "Full access to entire school system"},
        {"name": "headteacher", "display_name": "Headteacher / School Administrator", "description": "School administration and academic approvals"},
        {"name": "teacher", "display_name": "Teacher", "description": "Class and subject management, attendance, and grading"},
        {"name": "accountant", "display_name": "Accountant / Bursar", "description": "Fee billing, payments, receipts, and expenses"},
        {"name": "parent", "display_name": "Parent / Guardian", "description": "Portal for children attendance, results, fees"},
        {"name": "student", "display_name": "Student", "description": "Student dashboard for timetable, homework, and results"},
    ]
    roles_map = {}
    for r in roles_data:
        role = Role(name=r["name"], display_name=r["display_name"], description=r["description"])
        db.session.add(role)
        roles_map[r["name"]] = role
    db.session.flush()

    # 2. Permissions
    permissions_list = [
        ("students:view", "students", "View student records"),
        ("students:create", "students", "Register new students"),
        ("students:edit", "students", "Edit student profiles"),
        ("students:delete", "students", "Delete or archive student"),
        ("students:promote", "students", "Promote/transfer students"),
        ("attendance:view", "attendance", "View student attendance"),
        ("attendance:record", "attendance", "Record student attendance"),
        ("attendance:audit", "attendance", "Modify previous attendance entries"),
        ("marks:view", "academics", "View assessment scores"),
        ("marks:entry", "academics", "Enter continuous assessments and exam marks"),
        ("marks:approve", "academics", "Approve terminal results"),
        ("report_cards:publish", "academics", "Publish report cards to parents and students"),
        ("fees:view", "finance", "View student invoices and statements"),
        ("fees:record", "finance", "Record payments and generate receipts"),
        ("fees:manage", "finance", "Configure class fee structures"),
        ("expenses:manage", "finance", "Record and approve school expenses"),
        ("timetable:manage", "academics", "Manage master schedule and periods"),
        ("library:manage", "resources", "Manage books catalog and student loans"),
        ("inventory:manage", "resources", "Manage school assets and logistics"),
        ("users:manage", "admin", "Manage user logins and roles"),
        ("system:configure", "admin", "Configure school branding and calendar"),
    ]
    all_perm_objs = []
    for code, mod, desc in permissions_list:
        p = Permission(name=code, module=mod, description=desc)
        db.session.add(p)
        all_perm_objs.append(p)
    db.session.flush()

    # Assign permissions
    roles_map["super_admin"].permissions = all_perm_objs
    roles_map["headteacher"].permissions = [p for p in all_perm_objs if not p.name.startswith("system:")]
    roles_map["teacher"].permissions = [p for p in all_perm_objs if p.name in (
        "students:view", "attendance:view", "attendance:record", "marks:view", "marks:entry", "timetable:manage", "library:manage"
    )]
    roles_map["accountant"].permissions = [p for p in all_perm_objs if p.name in (
        "students:view", "fees:view", "fees:record", "fees:manage", "expenses:manage"
    )]
    roles_map["parent"].permissions = [p for p in all_perm_objs if p.name in ("students:view", "attendance:view", "marks:view", "fees:view")]
    roles_map["student"].permissions = [p for p in all_perm_objs if p.name in ("attendance:view", "marks:view")]
    db.session.flush()

    # 3. Academic Calendar: Ghanaian 3-term system
    current_year = AcademicYear(
        name="2025/2026",
        start_date=date(2025, 9, 8),
        end_date=date(2026, 7, 24),
        is_current=True
    )
    db.session.add(current_year)
    db.session.flush()

    term1 = Term(
        academic_year_id=current_year.id,
        name="Term 1",
        term_number=1,
        start_date=date(2025, 9, 8),
        end_date=date(2025, 12, 18),
        is_current=False
    )
    term2 = Term(
        academic_year_id=current_year.id,
        name="Term 2",
        term_number=2,
        start_date=date(2026, 1, 12),
        end_date=date(2026, 4, 16),
        is_current=True # Current active term
    )
    term3 = Term(
        academic_year_id=current_year.id,
        name="Term 3",
        term_number=3,
        start_date=date(2026, 5, 11),
        end_date=date(2026, 7, 24),
        is_current=False
    )
    db.session.add_all([term1, term2, term3])
    db.session.flush()

    # 4. School Settings
    school_setting = SchoolSetting(
        school_name="Charity Preparatory School",
        school_motto="Knowledge, Discipline, and Excellence",
        school_code="CPS-GH",
        address="P.O. Box CP 120, Accra, Ghana",
        phone="+233 24 412 3456",
        alt_phone="+233 20 890 1234",
        email="info@charitypreparatory.edu.gh",
        website="https://charitypreparatory.edu.gh",
        currency="GHS",
        currency_symbol="GH₵",
        ca_weight_percentage=30.0,
        exam_weight_percentage=70.0,
        ranking_enabled=True,
        current_academic_year_id=current_year.id,
        current_term_id=term2.id,
        sms_configured=False,
        email_configured=False,
        whatsapp_configured=False,
        momo_configured=False
    )
    db.session.add(school_setting)
    db.session.flush()

    # 5. Grading Scale (Ghanaian Standard Basic Education)
    grading_rules = [
        ("1", 80.0, 100.0, "Excellent", 1.0, 1),
        ("2", 70.0, 79.9, "Very Good", 2.0, 2),
        ("3", 65.0, 69.9, "Good", 3.0, 3),
        ("4", 60.0, 64.9, "Credit", 4.0, 4),
        ("5", 55.0, 59.9, "Credit", 5.0, 5),
        ("6", 50.0, 54.9, "Pass", 6.0, 6),
        ("7", 45.0, 49.9, "Pass", 7.0, 7),
        ("8", 40.0, 44.9, "Weak Pass", 8.0, 8),
        ("9", 0.0, 39.9, "Fail", 9.0, 9),
    ]
    for g, mn, mx, rem, pt, rk in grading_rules:
        db.session.add(GradingScale(grade=g, min_score=mn, max_score=mx, remark=rem, grade_point=pt, order_rank=rk))
    db.session.flush()

    # 6. Basic School Classes: Nursery 1-2, KG 1-2, Primary 1-6, JHS 1-3
    classes_definitions = [
        ("Nursery 1", "NUR1", "NURSERY", 1, 30),
        ("Nursery 2", "NUR2", "NURSERY", 2, 30),
        ("KG 1", "KG1", "KG", 3, 35),
        ("KG 2", "KG2", "KG", 4, 35),
        ("Primary 1", "P1", "PRIMARY", 5, 40),
        ("Primary 2", "P2", "PRIMARY", 6, 40),
        ("Primary 3", "P3", "PRIMARY", 7, 40),
        ("Primary 4", "P4", "PRIMARY", 8, 40),
        ("Primary 5", "P5", "PRIMARY", 9, 40),
        ("Primary 6", "P6", "PRIMARY", 10, 40),
        ("JHS 1", "JHS1", "JHS", 11, 45),
        ("JHS 2", "JHS2", "JHS", 12, 45),
        ("JHS 3", "JHS3", "JHS", 13, 45),
    ]
    classes_map = {}
    streams_map = {}
    for name, code, group, order, cap in classes_definitions:
        c = ClassLevel(name=name, code=code, level_group=group, order_index=order, capacity=cap)
        db.session.add(c)
        db.session.flush()
        classes_map[name] = c
        # Create standard Gold & Green streams
        s_gold = Stream(class_level_id=c.id, name="Gold")
        s_green = Stream(class_level_id=c.id, name="Green")
        db.session.add_all([s_gold, s_green])
        db.session.flush()
        streams_map[f"{name}-Gold"] = s_gold
        streams_map[f"{name}-Green"] = s_green

    # 7. Subjects: Ghanaian Basic Curriculum
    subjects_data = [
        ("English Language", "ENG", "CORE", "ALL"),
        ("Mathematics", "MATH", "CORE", "ALL"),
        ("Integrated Science", "SCI", "CORE", "ALL"),
        ("Social Studies", "SOC", "CORE", "PRIMARY"),
        ("Ghanaian Language (Twi)", "TWI", "CORE", "ALL"),
        ("Religious and Moral Education (RME)", "RME", "CORE", "ALL"),
        ("Computing / ICT", "ICT", "CORE", "ALL"),
        ("Creative Arts & Design", "CAD", "CORE", "PRIMARY"),
        ("Career Technology", "CAR_TECH", "CORE", "JHS"),
        ("French", "FRE", "ELECTIVE", "ALL"),
        ("Physical and Health Education (PHE)", "PHE", "CORE", "ALL"),
    ]
    subjects_map = {}
    for sname, scode, scat, sgrp in subjects_data:
        sub = Subject(name=sname, code=scode, category=scat, level_group=sgrp)
        db.session.add(sub)
        db.session.flush()
        subjects_map[scode] = sub

    # Assign subjects to classes (ClassSubjects)
    for cname, cl_obj in classes_map.items():
        for scode, sub_obj in subjects_map.items():
            if sub_obj.level_group == "JHS" and cl_obj.level_group != "JHS":
                continue
            if sub_obj.level_group == "PRIMARY" and cl_obj.level_group not in ("PRIMARY", "JHS"):
                continue
            cs = ClassSubject(class_level_id=cl_obj.id, subject_id=sub_obj.id)
            db.session.add(cs)
    db.session.flush()

    # 8. User Accounts & Staff
    # A. Super Admin
    admin_user = User(
        username="admin",
        email="admin@school.edu.gh",
        full_name="Dr. Nana Osei Tutu",
        phone="+233 24 111 2233",
        role_id=roles_map["super_admin"].id,
        is_active=True
    )
    admin_user.set_password("Admin@123")
    db.session.add(admin_user)

    # B. Headteacher
    head_user = User(
        username="headteacher",
        email="headteacher@school.edu.gh",
        full_name="Mrs. Gladys Boateng",
        phone="+233 20 222 3344",
        role_id=roles_map["headteacher"].id,
        is_active=True
    )
    head_user.set_password("Head@123")
    db.session.add(head_user)
    db.session.flush()

    head_staff = Staff(
        user_id=head_user.id,
        staff_id="STF-001",
        full_name="Mrs. Gladys Boateng",
        role_title="Headteacher",
        department="Administration",
        phone="+233 20 222 3344",
        email="headteacher@school.edu.gh",
        qualification="M.Ed. Educational Leadership, UCC",
        joining_date=date(2018, 9, 1)
    )
    db.session.add(head_staff)

    # C. Accountant / Bursar
    bursar_user = User(
        username="accountant",
        email="accountant@school.edu.gh",
        full_name="Mr. Emmanuel K. Amponsah",
        phone="+233 27 333 4455",
        role_id=roles_map["accountant"].id,
        is_active=True
    )
    bursar_user.set_password("Bursar@123")
    db.session.add(bursar_user)
    db.session.flush()

    bursar_staff = Staff(
        user_id=bursar_user.id,
        staff_id="STF-002",
        full_name="Mr. Emmanuel K. Amponsah",
        role_title="Accountant / Bursar",
        department="Finance",
        phone="+233 27 333 4455",
        email="accountant@school.edu.gh",
        qualification="B.Sc. Accounting, CA Ghana",
        joining_date=date(2020, 1, 15)
    )
    db.session.add(bursar_staff)

    # D. Teachers
    teachers_info = [
        ("kwame.mensah", "kwame.mensah@school.edu.gh", "Mr. Kwame Mensah", "+233 24 555 6677", "TCH-001", "Mathematics & Science", "B.Ed. Science, UEW", "Primary 5-Gold", "P5"),
        ("abena.asante", "abena.asante@school.edu.gh", "Ms. Abena Asante", "+233 24 666 7788", "TCH-002", "English & RME", "B.A. English & Linguistics, UG", "Primary 4-Gold", "P4"),
        ("kofi.addo", "kofi.addo@school.edu.gh", "Mr. Kofi Addo", "+233 20 777 8899", "TCH-003", "Computing & Science", "B.Sc. Computer Science & Education", "JHS 2-Gold", "JHS2"),
        ("esi.mensah", "esi.mensah@school.edu.gh", "Mrs. Esi Mensah", "+233 24 888 9900", "TCH-004", "Early Childhood", "Diploma in Basic Education", "KG 1-Gold", "KG1"),
    ]
    teachers_map = {}
    for uname, uemail, ufullname, uphone, stfid, spec, qual, assigned_stream, assigned_class in teachers_info:
        u = User(
            username=uname,
            email=uemail,
            full_name=ufullname,
            phone=uphone,
            role_id=roles_map["teacher"].id,
            is_active=True
        )
        u.set_password("Teacher@123")
        db.session.add(u)
        db.session.flush()

        tch = Teacher(
            user_id=u.id,
            staff_id=stfid,
            specialization=spec,
            qualification=qual,
            joining_date=date(2021, 9, 1),
            status="ACTIVE"
        )
        db.session.add(tch)
        db.session.flush()
        teachers_map[stfid] = tch

        # Assign as class teacher to stream
        if assigned_stream in streams_map:
            streams_map[assigned_stream].class_teacher_id = tch.id

        # Teacher Assignment for Math/English in that class
        cl_obj = classes_map.get(assigned_stream.split("-")[0])
        if cl_obj:
            sub = subjects_map["MATH"] if "Mathematics" in spec else subjects_map["ENG"]
            ta = TeacherAssignment(
                teacher_id=tch.id,
                class_level_id=cl_obj.id,
                stream_id=streams_map[assigned_stream].id,
                subject_id=sub.id,
                academic_year_id=current_year.id
            )
            db.session.add(ta)
    db.session.flush()

    # E. Parents / Guardians
    parent1_user = User(
        username="parent.kofi",
        email="parent.kofi@gmail.com",
        full_name="Mr. Kofi Annan Dankwa",
        phone="+233 24 999 1122",
        role_id=roles_map["parent"].id,
        is_active=True
    )
    parent1_user.set_password("Parent@123")
    db.session.add(parent1_user)
    db.session.flush()

    guardian_kofi = Guardian(
        user_id=parent1_user.id,
        full_name="Mr. Kofi Annan Dankwa",
        phone="+233 24 999 1122",
        alt_phone="+233 20 111 3344",
        email="parent.kofi@gmail.com",
        occupation="Civil Engineer",
        residential_address="House No. 45, Achimota Golf Hills, Accra"
    )
    db.session.add(guardian_kofi)

    parent2_user = User(
        username="parent.afua",
        email="parent.afua@gmail.com",
        full_name="Mrs. Afua Serwaa Prempeh",
        phone="+233 24 888 2211",
        role_id=roles_map["parent"].id,
        is_active=True
    )
    parent2_user.set_password("Parent@123")
    db.session.add(parent2_user)
    db.session.flush()

    guardian_afua = Guardian(
        user_id=parent2_user.id,
        full_name="Mrs. Afua Serwaa Prempeh",
        phone="+233 24 888 2211",
        email="parent.afua@gmail.com",
        occupation="Pharmacist",
        residential_address="Block B, Dome Pillar 2, Accra"
    )
    db.session.add(guardian_afua)
    db.session.flush()

    # F. Students
    # Student 1: Ama Serwaa Dankwa (Primary 5 - Gold)
    ama_user = User(
        username="student.ama",
        email="student.ama@school.edu.gh",
        full_name="Ama Serwaa Dankwa",
        phone="+233 24 999 1122",
        role_id=roles_map["student"].id,
        is_active=True
    )
    ama_user.set_password("Student@123")
    db.session.add(ama_user)
    db.session.flush()

    p5_gold = streams_map["Primary 5-Gold"]
    p5_class = classes_map["Primary 5"]

    student_ama = Student(
        user_id=ama_user.id,
        admission_number="SCH/2024/0001",
        first_name="Ama",
        last_name="Dankwa",
        other_names="Serwaa",
        gender="Female",
        date_of_birth=date(2015, 4, 18),
        admission_date=date(2023, 9, 5),
        residential_address="House No. 45, Achimota Golf Hills, Accra",
        previous_school="Ridge Preparatory School",
        emergency_contact_name="Mr. Kofi Annan Dankwa",
        emergency_contact_phone="+233 24 999 1122",
        medical_info="Mild peanut allergy. Inhaler kept with school clinic for seasonal asthma.",
        status="ACTIVE",
        current_class_id=p5_class.id,
        current_stream_id=p5_gold.id
    )
    db.session.add(student_ama)
    db.session.flush()

    # Link Guardian to Student
    sg1 = StudentGuardian(student_id=student_ama.id, guardian_id=guardian_kofi.id, relationship_type="Father", is_primary=True)
    db.session.add(sg1)

    # Student 2: Kwesi Boateng (JHS 2 - Gold)
    kwesi_user = User(
        username="student.kwesi",
        email="student.kwesi@school.edu.gh",
        full_name="Kwesi Boateng",
        phone="+233 24 888 2211",
        role_id=roles_map["student"].id,
        is_active=True
    )
    kwesi_user.set_password("Student@123")
    db.session.add(kwesi_user)
    db.session.flush()

    jhs2_gold = streams_map["JHS 2-Gold"]
    jhs2_class = classes_map["JHS 2"]

    student_kwesi = Student(
        user_id=kwesi_user.id,
        admission_number="SCH/2022/0045",
        first_name="Kwesi",
        last_name="Boateng",
        other_names="Nana",
        gender="Male",
        date_of_birth=date(2012, 8, 24),
        admission_date=date(2021, 9, 8),
        residential_address="Block B, Dome Pillar 2, Accra",
        previous_school="Achimota Primary",
        emergency_contact_name="Mrs. Afua Serwaa Prempeh",
        emergency_contact_phone="+233 24 888 2211",
        status="ACTIVE",
        current_class_id=jhs2_class.id,
        current_stream_id=jhs2_gold.id
    )
    db.session.add(student_kwesi)
    db.session.flush()

    sg2 = StudentGuardian(student_id=student_kwesi.id, guardian_id=guardian_afua.id, relationship_type="Mother", is_primary=True)
    db.session.add(sg2)

    # Add more diverse students across classes for rich, real data
    sample_students_data = [
        ("Kojo", "Antwi", "Junior", "Male", date(2015, 6, 12), "SCH/2024/0002", "Primary 5", "Gold", "Tesano, Accra"),
        ("Abena", "Ofori", "Atta", "Female", date(2015, 11, 3), "SCH/2024/0003", "Primary 5", "Gold", "Achimota Village, Accra"),
        ("Yaw", "Sarpong", "", "Male", date(2015, 2, 28), "SCH/2024/0004", "Primary 5", "Gold", "Dome, Accra"),
        ("Akua", "Mansah", "Boadi", "Female", date(2016, 7, 19), "SCH/2024/0010", "Primary 4", "Gold", "Mile 7, Achimota"),
        ("Kwabena", "Asante", "", "Male", date(2016, 3, 14), "SCH/2024/0011", "Primary 4", "Gold", "Lapaz, Accra"),
        ("Afia", "Konadu", "Yeboah", "Female", date(2017, 9, 9), "SCH/2024/0020", "Primary 3", "Gold", "Christian Village, Accra"),
        ("Fiifi", "Baffoe", "", "Male", date(2011, 10, 5), "SCH/2021/0088", "JHS 3", "Gold", "Abelemkpe, Accra"),
        ("Efua", "Agyemang", "Badu", "Female", date(2019, 5, 22), "SCH/2025/0050", "KG 2", "Gold", "Alajo, Accra"),
        ("Kofi", "Gyasi", "", "Male", date(2020, 1, 17), "SCH/2025/0075", "Nursery 2", "Gold", "Kotobabi, Accra"),
    ]
    created_students = [student_ama, student_kwesi]
    for fn, ln, on, gen, dob, adm, cname, sname, addr in sample_students_data:
        cl_obj = classes_map[cname]
        st_obj = streams_map[f"{cname}-{sname}"]
        st = Student(
            admission_number=adm,
            first_name=fn,
            last_name=ln,
            other_names=on,
            gender=gen,
            date_of_birth=dob,
            admission_date=date(2024, 9, 2),
            residential_address=addr,
            emergency_contact_name=f"Mr. {ln} Senior",
            emergency_contact_phone="+233 24 000 9988",
            status="ACTIVE",
            current_class_id=cl_obj.id,
            current_stream_id=st_obj.id
        )
        db.session.add(st)
        db.session.flush()
        created_students.append(st)

    # Enrollments for students in current year
    for st in created_students:
        enr = Enrollment(
            student_id=st.id,
            academic_year_id=current_year.id,
            class_level_id=st.current_class_id,
            stream_id=st.current_stream_id,
            status="ENROLLED"
        )
        db.session.add(enr)
    db.session.flush()

    # 9. Attendance records (Today and past few days)
    today = date.today()
    teachers_list = list(teachers_map.values())
    rec_user = teachers_list[0].user if teachers_list else admin_user

    for i in range(5):
        day_date = today - timedelta(days=i)
        if day_date.weekday() >= 5: # Skip weekend
            continue
        for idx, st in enumerate(created_students):
            # Ama and most are present, occasionally late or excused
            if idx == 1 and i == 1:
                status = "LATE"
                reason = "Heavy rain traffic on Dome road"
            elif idx == 3 and i == 2:
                status = "EXCUSED"
                reason = "Hospital checkup"
            elif idx == 4 and i == 0:
                status = "ABSENT"
                reason = "Unexplained absence"
            else:
                status = "PRESENT"
                reason = None

            att = Attendance(
                student_id=st.id,
                class_level_id=st.current_class_id,
                stream_id=st.current_stream_id,
                date=day_date,
                status=status,
                reason=reason,
                recorded_by=rec_user.id,
                parent_notified=(status == "ABSENT")
            )
            db.session.add(att)
    db.session.flush()

    # 10. Fee Structures for 2025/2026 Term 2
    fee_structures = [
        ("Tuition Fee", 850.0, True, "Standard termly instructional fee"),
        ("PTA Development Levy", 80.0, True, "Approved Parents-Teachers Association contribution"),
        ("ICT & Science Laboratory Fee", 120.0, True, "Practical lab materials and computing maintenance"),
        ("Examination & Report Card Fee", 50.0, True, "Continuous assessment tests and terminal exam papers"),
        ("Nutritional Feeding & Snack", 400.0, False, "Optional daily hot lunch and fruit break"),
    ]
    fs_objs = []
    for ftitle, famt, fmand, fdesc in fee_structures:
        fs = FeeStructure(
            academic_year_id=current_year.id,
            term_id=term2.id,
            class_level_id=None, # Applicable across school
            title=ftitle,
            amount=famt,
            is_mandatory=fmand,
            description=fdesc
        )
        db.session.add(fs)
        fs_objs.append(fs)
    db.session.flush()

    # Invoices & Payments
    # Ama Serwaa Dankwa - Primary 5
    inv_ama = Invoice(
        student_id=student_ama.id,
        academic_year_id=current_year.id,
        term_id=term2.id,
        invoice_number="INV-2026-0001",
        total_amount=1100.0, # Tuition + PTA + ICT + Exam
        discount_amount=0.0,
        paid_amount=1100.0,
        balance_due=0.0,
        status="PAID",
        due_date=date(2026, 2, 28)
    )
    db.session.add(inv_ama)
    db.session.flush()

    pay_ama = Payment(
        invoice_id=inv_ama.id,
        student_id=student_ama.id,
        reference_number="RCP-2026-0001",
        amount=1100.0,
        payment_method="MTN_MOMO",
        external_transaction_id="MTN-GH-998823120",
        payment_date=date(2026, 1, 15),
        status="CONFIRMED",
        notes="Full term 2 payment received via MTN Mobile Money",
        recorded_by_id=bursar_user.id
    )
    db.session.add(pay_ama)

    # Kwesi Boateng - JHS 2 (Partially paid)
    inv_kwesi = Invoice(
        student_id=student_kwesi.id,
        academic_year_id=current_year.id,
        term_id=term2.id,
        invoice_number="INV-2026-0002",
        total_amount=1500.0,
        discount_amount=100.0, # Sibling discount
        paid_amount=900.0,
        balance_due=500.0,
        status="PARTIALLY_PAID",
        due_date=date(2026, 2, 28)
    )
    db.session.add(inv_kwesi)
    db.session.flush()

    pay_kwesi = Payment(
        invoice_id=inv_kwesi.id,
        student_id=student_kwesi.id,
        reference_number="RCP-2026-0002",
        amount=900.0,
        payment_method="BANK_TRANSFER",
        external_transaction_id="GCB-TRF-0019283",
        payment_date=date(2026, 1, 20),
        status="CONFIRMED",
        notes="Part payment transferred from GCB Bank",
        recorded_by_id=bursar_user.id
    )
    db.session.add(pay_kwesi)

    # Other students with unpaid/partially paid invoices
    for i, st in enumerate(created_students[2:], start=3):
        inv = Invoice(
            student_id=st.id,
            academic_year_id=current_year.id,
            term_id=term2.id,
            invoice_number=f"INV-2026-000{i}",
            total_amount=1100.0,
            discount_amount=0.0,
            paid_amount=500.0 if i % 2 == 0 else 0.0,
            balance_due=600.0 if i % 2 == 0 else 1100.0,
            status="PARTIALLY_PAID" if i % 2 == 0 else "UNPAID",
            due_date=date(2026, 3, 15)
        )
        db.session.add(inv)
        if i % 2 == 0:
            db.session.flush()
            p = Payment(
                invoice_id=inv.id,
                student_id=st.id,
                reference_number=f"RCP-2026-000{i}",
                amount=500.0,
                payment_method="CASH",
                payment_date=date(2026, 2, 5),
                status="CONFIRMED",
                notes="Initial instalment cash deposit",
                recorded_by_id=bursar_user.id
            )
            db.session.add(p)
    db.session.flush()

    # 11. School Expenses
    expenses_data = [
        ("UTILITIES", "Electricity Company of Ghana (ECG) Pre-paid Power", 2450.0, date(2026, 2, 2), "ECG Achimota District", "ECG-REC-9921"),
        ("UTILITIES", "Ghana Water Company Limited (GWCL) Bill", 850.0, date(2026, 2, 5), "GWCL", "GWCL-00281"),
        ("SUPPLIES", "Term 2 Exercise Books, Chalk & Whiteboard Markers", 1850.0, date(2026, 1, 10), "Kingdom Books & Stationery", "KBS-INV-441"),
        ("MAINTENANCE", "Servicing of 20 ICT Lab Desktop Computers & UPS", 1200.0, date(2026, 1, 28), "Compufix Ghana Ltd", "CFX-8821"),
        ("FEEDING", "Food Ingredients & Fresh Vegetables for Kitchen", 3200.0, date(2026, 2, 12), "Dome Central Market Traders", "MKT-BATCH-2"),
    ]
    for cat, tit, amt, dt, pto, rec in expenses_data:
        exp = Expense(
            category=cat,
            title=tit,
            amount=amt,
            expense_date=dt,
            paid_to=pto,
            receipt_reference=rec,
            status="APPROVED",
            recorded_by_id=bursar_user.id,
            approved_by_id=head_user.id
        )
        db.session.add(exp)
    db.session.flush()

    # 12. Assessments & Scores for Primary 5 (Class Score 30%, Exam 70%)
    p5_assessments = [
        ("English Mid-Term Test", "CLASS_SCORE", 100.0, 30.0, subjects_map["ENG"]),
        ("English End of Term Exam", "EXAM", 100.0, 70.0, subjects_map["ENG"]),
        ("Mathematics Mid-Term Test", "CLASS_SCORE", 100.0, 30.0, subjects_map["MATH"]),
        ("Mathematics End of Term Exam", "EXAM", 100.0, 70.0, subjects_map["MATH"]),
        ("Science Practical & Project", "CLASS_SCORE", 100.0, 30.0, subjects_map["SCI"]),
        ("Science End of Term Exam", "EXAM", 100.0, 70.0, subjects_map["SCI"]),
    ]
    p5_students = [s for s in created_students if s.current_class_id == p5_class.id]
    
    for aname, atype, maxm, wgt, sub in p5_assessments:
        ass = Assessment(
            term_id=term2.id,
            class_level_id=p5_class.id,
            stream_id=p5_gold.id,
            subject_id=sub.id,
            name=aname,
            assessment_type=atype,
            max_marks=maxm,
            weight_percentage=wgt,
            is_published=True,
            is_locked=False,
            created_by_id=rec_user.id
        )
        db.session.add(ass)
        db.session.flush()

        # Add scores for students
        for s in p5_students:
            score_val = 88.0 if s.id == student_ama.id else 74.0
            if "Math" in aname and s.id == student_ama.id:
                score_val = 92.0
            asc = AssessmentScore(
                assessment_id=ass.id,
                student_id=s.id,
                raw_score=score_val,
                weighted_score=(score_val / maxm) * wgt,
                remarks="Commendable grasp of subject concepts" if score_val >= 80 else "Good performance"
            )
            db.session.add(asc)
    db.session.flush()

    # Report Card for Ama Serwaa Dankwa
    rc_ama = ReportCard(
        student_id=student_ama.id,
        academic_year_id=current_year.id,
        term_id=term2.id,
        class_level_id=p5_class.id,
        stream_id=p5_gold.id,
        total_marks=268.0,
        average_score=89.3,
        overall_grade="1",
        class_position=1,
        total_students_in_class=len(p5_students),
        attendance_present=58,
        attendance_total_days=60,
        class_teacher_remarks="Ama is an outstanding, respectful, and highly motivated learner. Excellent terminal performance.",
        headteacher_remarks="Brilliant terminal results. Ama sets a high standard for academic excellence in Primary 5.",
        promotion_status="On Track for Primary 6",
        is_approved=True,
        is_published=True,
        is_locked=True,
        approved_by_id=head_user.id,
        published_at=datetime.utcnow()
    )
    db.session.add(rc_ama)
    db.session.flush()

    # 13. Timetable Slots
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        (1, "08:00", "08:45", subjects_map["ENG"]),
        (2, "08:45", "09:30", subjects_map["MATH"]),
        (3, "09:45", "10:30", subjects_map["SCI"]),
        (4, "10:30", "11:15", subjects_map["ICT"]),
        (5, "11:45", "12:30", subjects_map["RME"]),
        (6, "12:30", "13:15", subjects_map["TWI"]),
    ]
    first_teacher = list(teachers_map.values())[0]
    for d in days:
        for pnum, stime, etime, sub in periods:
            slot = TimetableSlot(
                academic_year_id=current_year.id,
                class_level_id=p5_class.id,
                stream_id=p5_gold.id,
                subject_id=sub.id,
                teacher_id=first_teacher.id,
                day_of_week=d,
                period_number=pnum,
                start_time=stime,
                end_time=etime,
                room_number="Room P5-A"
            )
            db.session.add(slot)
    db.session.flush()

    # 14. Calendar Events
    events_data = [
        ("Mid-Term Break (Term 2)", "HOLIDAY", date(2026, 2, 26), date(2026, 2, 27), "Mid-term recess for all learners and staff.", True),
        ("Ghana Independence Day Holiday", "HOLIDAY", date(2026, 3, 6), date(2026, 3, 6), "69th Ghana National Independence Day celebrations.", True),
        ("2nd Term General P.T.A. Meeting", "PTA_MEETING", date(2026, 3, 14), date(2026, 3, 14), "Discussion on learner welfare, school expansion, and terminal exams.", False),
        ("End of Term 2 Examinations", "EXAMINATION", date(2026, 4, 6), date(2026, 4, 15), "Terminal examinations across Nursery, KG, Primary, and JHS.", False),
        ("Vacation & Speech and Prize-Giving Day", "EVENT", date(2026, 4, 16), date(2026, 4, 16), "Official closing of Term 2 and presentation of academic awards.", False),
    ]
    for etit, etyp, sdt, edt, edesc, ehol in events_data:
        ev = SchoolCalendarEvent(
            academic_year_id=current_year.id,
            term_id=term2.id,
            title=etit,
            event_type=etyp,
            start_date=sdt,
            end_date=edt,
            description=edesc,
            is_holiday=ehol
        )
        db.session.add(ev)
    db.session.flush()

    # 15. Announcements & Notifications
    ann1 = Announcement(
        title="2nd Term General P.T.A. Meeting Notice",
        content="Notice is hereby given to all parents and guardians that our 2nd Term General P.T.A. meeting will take place at the School Assembly Hall on Saturday, 14th March 2026 at 9:00 AM prompt.",
        target_role="PARENTS",
        priority="HIGH",
        is_active=True,
        published_by_id=head_user.id,
        expiry_date=date(2026, 3, 15)
    )
    ann2 = Announcement(
        title="B.E.C.E. Mock Examination Timetable for JHS 3",
        content="The first round of Basic Education Certificate Examination (B.E.C.E.) mock papers for JHS 3 candidates begins on Monday, 23rd March 2026. Learners are urged to prepare adequately.",
        target_role="STUDENTS",
        class_level_id=classes_map["JHS 3"].id,
        priority="NORMAL",
        is_active=True,
        published_by_id=head_user.id
    )
    db.session.add_all([ann1, ann2])
    db.session.flush()

    notif1 = Notification(
        user_id=parent1_user.id,
        title="Payment Receipt Issued",
        message="Full payment of GH₵ 1,100.00 for Ama Serwaa Dankwa has been acknowledged. Receipt #RCP-2026-0001.",
        notification_type="FEES",
        link="/receipts",
        is_read=False
    )
    notif2 = Notification(
        user_id=ama_user.id,
        title="Mathematics Quiz Score Uploaded",
        message="Your score for Mathematics Mid-Term Test is now published: 92/100 (Grade 1).",
        notification_type="ACADEMIC",
        link="/assessments",
        is_read=False
    )
    db.session.add_all([notif1, notif2])
    db.session.flush()

    # 16. Library Books & Loans
    library_catalog = [
        ("LIB-001", "978-0198487234", "The Cockcrow: An Anthology of Literature for Basic Schools", "S.A. Amoah", "Literature", 40, 36, "Shelf A-1", 2020),
        ("LIB-002", "978-0198390123", "Integrated Science for Ghanaian Basic Schools - Book 5", "Prof. K.A. Agyeman", "Science", 45, 42, "Shelf B-2", 2022),
        ("LIB-003", "978-9964104567", "Ghanaian History & Heritage: From Ancient Ghana to the Fourth Republic", "Dr. E. Addo-Fening", "History", 30, 29, "Shelf C-1", 2021),
        ("LIB-004", "978-0141324567", "The Dilemma of a Ghost and Anowa", "Ama Ata Aidoo", "Literature", 25, 23, "Shelf A-2", 2019),
        ("LIB-005", "978-0198421111", "Oxford Primary English Dictionary for West Africa", "Oxford University Press", "Reference", 50, 48, "Ref Section", 2023),
    ]
    lib_objs = []
    for bcode, bisbn, btit, bauth, bcat, btot, bavail, bshlf, byr in library_catalog:
        lb = LibraryBook(
            book_code=bcode,
            isbn=bisbn,
            title=btit,
            author=bauth,
            category=bcat,
            total_copies=btot,
            available_copies=bavail,
            shelf_location=bshlf,
            publication_year=byr
        )
        db.session.add(lb)
        lib_objs.append(lb)
    db.session.flush()

    loan1 = BookLoan(
        book_id=lib_objs[0].id,
        student_id=student_ama.id,
        borrow_date=date(2026, 2, 10),
        due_date=date(2026, 2, 24),
        status="BORROWED",
        issued_by_id=bursar_user.id
    )
    db.session.add(loan1)
    db.session.flush()

    # 17. School Assets
    assets_data = [
        ("AST-ICT-001", "HP ProDesk 400 G6 Core i5 Desktop Computer (Set of 25)", "COMPUTERS_ICT", 25, date(2022, 8, 15), 45000.0, "GOOD", "Computer Lab 1", "ICT Dept"),
        ("AST-FURN-002", "Dual Dual-Seater Hexagonal Wooden Desks & Chairs", "FURNITURE", 120, date(2023, 1, 10), 36000.0, "GOOD", "Primary 1 - 6 Classrooms", "Facilities"),
        ("AST-SCI-003", "Monocular Compound Student Biology Microscopes (x40-x400)", "LABORATORY", 12, date(2023, 5, 20), 14400.0, "GOOD", "Science Lab", "Science Dept"),
        ("AST-SPRT-004", "Standard FIFA Size 5 Footballs & Training Cones", "SPORTS", 15, date(2024, 1, 12), 2250.0, "FAIR", "Sports Store", "PE Department"),
        ("AST-GEN-005", "Perkins 45kVA Soundproof Diesel Backup Generator", "PROPERTY", 1, date(2021, 3, 5), 85000.0, "GOOD", "Power House", "Estate Manager"),
    ]
    for acode, aname, acat, aqty, apdate, acost, acond, aloc, aassigned in assets_data:
        asset = SchoolAsset(
            asset_code=acode,
            name=aname,
            category=acat,
            quantity=aqty,
            purchase_date=apdate,
            purchase_cost=acost,
            current_condition=acond,
            location=aloc,
            assigned_to=aassigned
        )
        db.session.add(asset)
    db.session.flush()

    db.session.commit()
    print("[Seed] Successfully populated complete Ghanaian Basic School demonstration data!")
