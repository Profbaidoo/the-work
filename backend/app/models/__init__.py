from backend.app.models.base import db, BaseModel
from backend.app.models.user import User, Role, Permission, AuditLog, role_permissions
from backend.app.models.academic import AcademicYear, Term, ClassLevel, Stream, Subject, ClassSubject, TeacherAssignment
from backend.app.models.student import Student, Guardian, StudentGuardian, Enrollment
from backend.app.models.staff import Teacher, Staff, StaffAttendance
from backend.app.models.attendance import Attendance
from backend.app.models.assessment import GradingScale, Assessment, AssessmentScore, ReportCard
from backend.app.models.finance import FeeStructure, Invoice, Payment, PaymentAllocation, Expense
from backend.app.models.timetable import TimetableSlot, SchoolCalendarEvent
from backend.app.models.communication import Announcement, Notification, CommunicationLog
from backend.app.models.resource import LibraryBook, BookLoan, SchoolAsset
from backend.app.models.settings import SchoolSetting

__all__ = [
    "db",
    "BaseModel",
    "User",
    "Role",
    "Permission",
    "AuditLog",
    "role_permissions",
    "AcademicYear",
    "Term",
    "ClassLevel",
    "Stream",
    "Subject",
    "ClassSubject",
    "TeacherAssignment",
    "Student",
    "Guardian",
    "StudentGuardian",
    "Enrollment",
    "Teacher",
    "Staff",
    "StaffAttendance",
    "Attendance",
    "GradingScale",
    "Assessment",
    "AssessmentScore",
    "ReportCard",
    "FeeStructure",
    "Invoice",
    "Payment",
    "PaymentAllocation",
    "Expense",
    "TimetableSlot",
    "SchoolCalendarEvent",
    "Announcement",
    "Notification",
    "CommunicationLog",
    "LibraryBook",
    "BookLoan",
    "SchoolAsset",
    "SchoolSetting",
]
