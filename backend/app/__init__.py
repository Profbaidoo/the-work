import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from backend.app.config import Config
from backend.app.models.base import db
from backend.app.routes import (
    auth_bp, dashboard_bp, students_bp, academics_bp,
    attendance_bp, assessments_bp, report_cards_bp, finance_bp,
    staff_bp, timetable_bp, communication_bp, library_bp,
    inventory_bp, reports_bp, settings_bp
)
from backend.app.seed_data import seed_database

jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ensure uploads directory
    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(academics_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(assessments_bp)
    app.register_blueprint(report_cards_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(timetable_bp)
    app.register_blueprint(communication_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)

    @app.route("/", methods=["GET"])
    def root():
        """Auto-redirect from backend port 5000 to the React frontend portal on port 3000"""
        from flask import redirect
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="0; url=http://localhost:3000" />
            <title>Charity Preparatory School</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; background: #0f172a; color: white; margin: 0; text-align: center; }
                .card { background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; max-width: 450px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                h2 { color: #f59e0b; margin-bottom: 8px; }
                p { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
                a { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; transition: background 0.2s; }
                a:hover { background: #fbbf24; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Charity Preparatory School</h2>
                <p>Redirecting to the web portal on port 3000...</p>
                <a href="http://localhost:3000">Open School Portal (http://localhost:3000)</a>
            </div>
        </body>
        </html>
        """, 200

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "system": "Ghana Basic School Management System",
            "version": "1.0.0",
            "currency": app.config.get("DEFAULT_CURRENCY", "GHS")
        }), 200

    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"error": "Missing or invalid authorization token"}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired. Please log in again."}), 401

    # Auto create tables and seed demo data on first start if not present
    with app.app_context():
        db.create_all()
        try:
            seed_database()
        except Exception as e:
            print(f"[Init Warning] Database auto-seed note: {e}")

    return app
