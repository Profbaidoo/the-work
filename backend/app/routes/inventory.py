from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.base import db
from backend.app.models import SchoolAsset
from backend.app.utils.auth_middleware import get_current_user, role_required
from backend.app.utils.audit import log_audit_action

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")

@inventory_bp.route("/assets", methods=["GET"])
@jwt_required()
def list_assets():
    category = request.args.get("category")
    condition = request.args.get("condition")

    query = SchoolAsset.query
    if category and category != "ALL":
        query = query.filter_by(category=category)
    if condition and condition != "ALL":
        query = query.filter_by(current_condition=condition)

    assets = query.order_by(SchoolAsset.name.asc()).all()
    return jsonify({"assets": [a.to_dict() for a in assets]}), 200

@inventory_bp.route("/assets", methods=["POST"])
@jwt_required()
@role_required("super_admin", "accountant", "headteacher")
def create_asset():
    current_user = get_current_user()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    category = data.get("category", "FURNITURE")
    quantity = int(data.get("quantity", 1))
    cost = float(data.get("purchase_cost", 0.0))
    location = data.get("location", "Main Campus")
    condition = data.get("current_condition", "GOOD")
    asset_code = data.get("asset_code", f"AST-{datetime.utcnow().strftime('%Y')}-{SchoolAsset.query.count()+1:03d}")
    assigned_to = data.get("assigned_to")
    notes = data.get("maintenance_notes")

    if not name:
        return jsonify({"error": "Asset name is required"}), 400

    asset = SchoolAsset(
        asset_code=asset_code,
        name=name,
        category=category,
        quantity=quantity,
        purchase_cost=cost,
        location=location,
        current_condition=condition,
        assigned_to=assigned_to,
        maintenance_notes=notes,
        purchase_date=date.today()
    )
    db.session.add(asset)
    db.session.commit()
    log_audit_action(current_user.id, "ASSET_CREATE", "INVENTORY", f"Added asset '{name}' ({asset_code})")

    return jsonify({"message": "Asset added successfully", "asset": asset.to_dict()}), 201

@inventory_bp.route("/assets/<int:asset_id>/condition", methods=["PUT"])
@jwt_required()
@role_required("super_admin", "headteacher", "accountant")
def update_asset_condition(asset_id):
    current_user = get_current_user()
    asset = SchoolAsset.query.get_or_404(asset_id)
    data = request.get_json() or {}
    new_cond = data.get("condition")
    notes = data.get("maintenance_notes")

    if new_cond:
        asset.current_condition = new_cond
    if notes:
        asset.maintenance_notes = notes

    db.session.commit()
    log_audit_action(current_user.id, "ASSET_UPDATE", "INVENTORY", f"Updated condition of {asset.name} to {new_cond}")

    return jsonify({"message": "Asset condition updated", "asset": asset.to_dict()}), 200
