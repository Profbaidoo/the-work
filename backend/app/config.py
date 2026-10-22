import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-school-key-change-in-prod-ghana-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-ghana-school-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_HOURS", 12)))
    
    # Database config: default to SQLite if MySQL URL is not provided or if MySQL is unavailable
    MYSQL_USER = os.getenv("DB_USER", "root")
    MYSQL_PASSWORD = os.getenv("DB_PASSWORD", "")
    MYSQL_HOST = os.getenv("DB_HOST", "localhost")
    MYSQL_PORT = os.getenv("DB_PORT", "3306")
    MYSQL_NAME = os.getenv("DB_NAME", "school_management_db")
    
    # Priority: explicit DATABASE_URL -> constructed MySQL URL -> local SQLite database
    ENV_DATABASE_URL = os.getenv("DATABASE_URL")
    if ENV_DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = ENV_DATABASE_URL
    elif os.getenv("USE_MYSQL", "false").lower() in ("true", "1", "yes"):
        SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_NAME}"
    else:
        # Robust local SQLite database default
        db_path = os.path.join(BASE_DIR, "school_management.db")
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
    } if "mysql" in SQLALCHEMY_DATABASE_URI else {}

    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    
    # School Defaults (Ghanaian context)
    DEFAULT_SCHOOL_NAME = os.getenv("SCHOOL_NAME", "Achimota Royal Basic Academy")
    DEFAULT_SCHOOL_MOTTO = os.getenv("SCHOOL_MOTTO", "Knowledge, Discipline, and Excellence")
    DEFAULT_SCHOOL_ADDRESS = os.getenv("SCHOOL_ADDRESS", "P.O. Box AC 48, Achimota - Accra, Ghana")
    DEFAULT_SCHOOL_PHONE = os.getenv("SCHOOL_PHONE", "+233 24 412 3456")
    DEFAULT_SCHOOL_EMAIL = os.getenv("SCHOOL_EMAIL", "info@achimotabasic.edu.gh")
    DEFAULT_CURRENCY = "GHS"
    DEFAULT_CURRENCY_SYMBOL = "GH₵"
