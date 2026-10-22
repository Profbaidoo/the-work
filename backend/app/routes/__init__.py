from backend.app.routes.auth import auth_bp
from backend.app.routes.dashboard import dashboard_bp
from backend.app.routes.students import students_bp
from backend.app.routes.academics import academics_bp
from backend.app.routes.attendance import attendance_bp
from backend.app.routes.assessments import assessments_bp
from backend.app.routes.report_cards import report_cards_bp
from backend.app.routes.finance import finance_bp
from backend.app.routes.staff import staff_bp
from backend.app.routes.timetable import timetable_bp
from backend.app.routes.communication import communication_bp
from backend.app.routes.library import library_bp
from backend.app.routes.inventory import inventory_bp
from backend.app.routes.reports import reports_bp
from backend.app.routes.settings import settings_bp

__all__ = [
    "auth_bp",
    "dashboard_bp",
    "students_bp",
    "academics_bp",
    "attendance_bp",
    "assessments_bp",
    "report_cards_bp",
    "finance_bp",
    "staff_bp",
    "timetable_bp",
    "communication_bp",
    "library_bp",
    "inventory_bp",
    "reports_bp",
    "settings_bp",
]
