# Professional Basic School Management System (Ghana)
**Achimota Royal Basic Academy Management Information System**

A modern, secure, full-stack School Management System designed specifically for basic schools in Ghana covering **Nursery 1–2**, **Kindergarten (KG 1–2)**, **Primary 1–6**, and **Junior High School (JHS 1–3)**.

Organized around the **Ghanaian 3-Term Academic Calendar**, **Ghana Cedis (GH₵ / GHS)**, Ghanaian Basic Education curriculum subjects, continuous assessment rules (Class Score 30% / Exam 70% configurable), and official terminal report card and payment receipt generation.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Super Administrator**: Full school management, user logins, roles, database snapshots, and school policy configuration.
   - **Headteacher / Administrator**: Academic monitoring, class & subject assignments, result approvals, reports, and attendance auditing.
   - **Teachers**: Class registers, continuous assessment & exam marks entry, terminal comments, and timetable viewing.
   - **Accountant / Bursar**: Fee structures, batch invoicing, payment recordings (Cash, Bank Transfer, MTN MoMo, Telecel Cash), official printable receipts, and expenses ledger.
   - **Parents / Guardians**: Child progress monitoring, attendance tracking, fee statements, and terminal report card PDF downloads.
   - **Students**: Academic report viewing, timetable, homework, and school notices.

2. **Main Executive Dashboard**:
   - Live summary metrics computed directly from database records (Total Students, Staff, Active Classes, Present/Absent today, Fees Collected, Arrears).
   - Recharts interactive visualizations:
     - Student Enrollment by Class Level.
     - Daily Attendance Trend.
     - Terminal Academic Performance by Subject.
     - Fee Collections vs Outstanding Arrears.
   - Upcoming Examinations & School Events calendar feed.
   - Real-time Audit Trail activity logs.

3. **Student Information & Admissions**:
   - Automated admission number generator (`SCH/YYYY/NNNN`).
   - Comprehensive biodata, photo, DOB, gender, Ghanaian residential address, previous school.
   - Parent/guardian linkages with relationship designations.
   - Confidential medical & accessibility flags (restricted access).
   - Class promotions, stream transfers, and one-click printable **Student Biodata PDF** forms.
   - CSV export of student rosters.

4. **Class & Curriculum Management**:
   - Pre-configured for Nursery 1-2, KG 1-2, Primary 1-6, and JHS 1-3.
   - Custom streams (*Gold*, *Green*, *A*, *B*).
   - Ghanaian Basic Education subjects (English Language, Mathematics, Integrated Science, Social Studies, Ghanaian Language [Twi], Career Technology, Computing/ICT, Creative Arts, R.M.E., French, P.H.E.).
   - Class teacher & subject teacher allocations.

5. **Daily Attendance Management**:
   - Complete class register view with one-click "Mark All Present".
   - Individual status: *Present*, *Absent*, *Late*, *Excused*.
   - Reason logging and automated parent absence alert flag.
   - Unique constraints preventing duplicate attendance records on the same date.
   - Attendance percentages and frequent absentee detection.

6. **Examinations & Report Cards**:
   - Continuous assessment (CA) tests + Terminal Exam marks entry.
   - Configurable assessment weights (default 30% CA / 70% Exam, or 50/50).
   - Ghanaian 9-Point Basic Education grading scale boundaries.
   - Automated terminal report card compilation: weighted total marks, class ranking/position, attendance statistics, teacher comments, and headteacher remarks.
   - Approval & publishing workflow that locks marks against unauthorized changes.
   - **Authoritative ReportLab PDF Report Card Generation** ready for printing with official school header, crest, and signature spaces.

7. **School Fees & Accounting (GH₵)**:
   - Configurable fee structures (Tuition, PTA Levy, ICT & Science Lab, Exams, Nutritional Feeding).
   - Batch invoice generator for enrolled classes.
   - Payment channels: **Cash**, **Bank Deposit**, **MTN Mobile Money**, **Telecel Cash**, **AirtelTigo Money**, and **Cheques**.
   - Unique payment receipt numbers (`RCP-YYYY-NNNN`).
   - **Official Payment Receipt PDF Generation** with balance remaining.
   - Operating expenses ledger with categorization (Utilities, Supplies, Maintenance, Feeding, Salaries).
   - Financial statement reporting with class-by-class fee recovery analysis.

8. **Timetable & Conflict Detection**:
   - Weekly matrix schedule builder (Monday – Friday, Periods 1 to 8).
   - Automatic double-booking detection (prevents assigning a teacher or room to multiple classes at the same time).
   - School academic calendar events (Terms, mid-term recesses, public holidays, PTA meetings).

9. **Library & School Logistics**:
   - Library book catalog with ISBN, shelf location, and copy tracking.
   - Student & teacher borrowing loans, return logging, and overdue fine calculations.
   - Asset inventory tracking: computers, classroom furniture, lab apparatus, and sports equipment.

10. **Communication & Gateway Checker**:
    - School-wide and role-targeted announcements.
    - In-app notification center.
    - Live SMS / Email / WhatsApp gateway connectivity status indicator that transparently indicates when third-party provider API keys are unconfigured.

---

## 🛠️ Technology Stack

- **Backend**:
  - Python 3.10+ / 3.14
  - Flask (REST API architecture)
  - SQLAlchemy ORM (Relational database with 30+ normalized entities)
  - Flask-JWT-Extended (Token-based authentication & RBAC)
  - ReportLab (High-fidelity PDF generation for report cards, receipts, biodata)
  - Pytest (Automated test suite)
  - PyMySQL & SQLite (Seamless dual support: defaults to zero-config local database, or connects directly to MySQL 8.0 via environment variables)
- **Frontend**:
  - React 18+ / 19 with TypeScript
  - Vite build tool & bundler
  - Tailwind CSS v4
  - Lucide React icons
  - Recharts (Interactive charting)
  - React Router DOM v7
  - Axios API client with automatic JWT interceptors

---

## 🔑 Demonstration Accounts (Pre-Seeded)

The system automatically initializes and seeds realistic demonstration data for a Ghanaian basic school with accounts for all 6 user roles:

| Role | Username / Email | Password | Representative Name |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@school.edu.gh` | `Admin@123` | Dr. Nana Osei Tutu |
| **Headteacher** | `headteacher@school.edu.gh` | `Head@123` | Mrs. Gladys Boateng |
| **Teacher** | `kwame.mensah@school.edu.gh` | `Teacher@123` | Mr. Kwame Mensah |
| **Accountant / Bursar** | `accountant@school.edu.gh` | `Bursar@123` | Mr. Emmanuel K. Amponsah |
| **Parent / Guardian** | `parent.kofi@gmail.com` | `Parent@123` | Mr. Kofi Annan Dankwa |
| **Student** | `student.ama@school.edu.gh` | `Student@123` | Ama Serwaa Dankwa (Primary 5) |

> 💡 **Quick Role Switcher**: When logged into the application, use the **"Role"** pill in the top navigation bar to switch between user personas with a single click!

---

## 🚀 Installation & Local Setup

### 1. Prerequisites
- Python 3.10 or higher
- Node.js v18+ and npm
- (Optional) MySQL 8.0 Server

### 2. Backend Setup
1. Open terminal in the project root:
   ```powershell
   # Create and activate virtual environment
   python -m venv venv
   .\venv\Scripts\activate   # Windows PowerShell
   # source venv/bin/activate # Linux / macOS

   # Install dependencies
   pip install -r backend/requirements.txt
   ```

2. Environment configuration:
   ```powershell
   copy .env.example .env
   ```
   *Note: By default, the application runs out-of-the-box using the SQLite database engine `backend/school_management.db`. To connect to a local or remote MySQL Server, set `USE_MYSQL=true` and fill in `DB_USER` and `DB_PASSWORD` in your `.env` file.*

3. Start the Backend API server:
   ```powershell
   $env:PYTHONPATH="."
   python backend/run.py
   ```
   The backend API will start on **`http://localhost:5000`** and will automatically create all tables and populate seed data on first run.

### 3. Frontend Setup
1. In a separate terminal, navigate to `frontend`:
   ```powershell
   cd frontend
   npm install
   ```

2. Start the development server:
   ```powershell
   npm run dev
   ```
   The web portal will open on **`http://localhost:3000`** (or Vite's assigned port).

---

## 🧪 Automated Testing

A comprehensive automated test suite covers authentication, role permissions, student registration, attendance registers, assessment calculations, and financial payments:

```powershell
# In project root with venv activated:
$env:PYTHONPATH="."
pytest -v backend/tests
```

All 14 unit and integration tests will execute and verify backend business logic.

---

## 📄 Complete Index of 20 Application Pages

| # | Page / Module | URL Path | Description |
| :- | :--- | :--- | :--- |
| 1 | **Login & Recovery** | `/login` | Secure JWT login, 1-click test pills, password recovery info |
| 2 | **Main Dashboard** | `/` | Real DB statistics, attendance & fee charts, upcoming exams |
| 3 | **Student Registration** | `/students/new` | Full student biodata admission form with guardian linkage |
| 4 | **Student Directory** | `/students` | Searchable student roster, class filters, CSV export, promotion |
| 5 | **Student Profile** | `/students/:id` | Individual student profile, attendance rate, PDF biodata download |
| 6 | **Guardians Management** | `/guardians` | Directory of parents, emergency contacts, linked children |
| 7 | **Teachers & Staff** | `/staff` | Staff directory, qualifications, daily staff check-in register |
| 8 | **Classes & Subjects** | `/classes-subjects` | Nursery to JHS class builder, streams, curriculum subjects |
| 9 | **Attendance Register** | `/attendance` | Daily class register, present/absent/late, parent alert flag |
| 10 | **Marks Entry** | `/assessments` | CA test & exam marks entry, weighting, grading scale editor |
| 11 | **Report Card Generation**| `/report-cards` | Terminal report cards, rankings, remarks, **ReportLab PDF download** |
| 12 | **Fees & Invoices** | `/fees-invoices` | Class fee structures, batch billing, student invoice tracker |
| 13 | **Payment Receipts** | `/payments` | Record payments (MoMo/Cash/Bank), **Official PDF Receipt** |
| 14 | **Expenses & Financials**| `/expenses` | Expenditures, approvals, net operating balance, recovery rates |
| 15 | **Timetable & Calendar** | `/timetable` | Weekly schedule matrix, room conflict detector, school events |
| 16 | **Announcements** | `/announcements` | Targeted notices, in-app notifications, gateway checker |
| 17 | **Library Management** | `/library` | Book catalog, loans tracking, return dates, overdue fines |
| 18 | **Inventory Logistics** | `/inventory` | Asset tracking, ICT computers, furniture, condition monitoring |
| 19 | **Reports & Analytics** | `/reports` | Enrollment demographics, terminal fee collection CSV exports |
| 20 | **User Accounts & Roles**| `/users` | User management, security permissions, database snapshots |
| 21 | **School Settings** | `/settings` | School branding, contact, active academic term switcher |

---

## 🛡️ Security & Compliance
- **Password Protection**: Passwords are securely hashed using modern cryptographic algorithms (`werkzeug.security` / Argon2 / bcrypt).
- **Session Tokens**: JSON Web Tokens (JWT) with configured expiration periods and role claims.
- **Role Verification**: Server-side `@role_required` and `@permission_required` decorators on sensitive endpoints.
- **Audit Logging**: Sensitive mutations (student registration, promotions, marks entry, fee payments, and settings changes) log user ID, timestamp, and IP addresses.
- **Data Protection**: Medical and accessibility details are restricted to authorized medical, administration, and teaching personnel.
