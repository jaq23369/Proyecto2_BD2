from flask import Blueprint, request
from schemas.rel_schemas import (
    CreateRelPayload, UpdateRelPropsPayload, RemoveRelPropsPayload,
    BulkRelUpdatePayload, BulkRelRemovePayload,
)
from services import rel_service
from utils.responses import ok, created

rels_bp = Blueprint("relationships", __name__, url_prefix="/api/relationships")


@rels_bp.post("")
def create_rel():
    payload = CreateRelPayload(**request.get_json(force=True))
    rel = rel_service.create_relationship(
        payload.from_label, payload.from_id,
        payload.to_label, payload.to_id,
        payload.type, payload.properties,
    )
    return created(rel)


@rels_bp.get("")
def get_rels():
    rel_type = request.args.get("type", "")
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    filters = {k: v for k, v in request.args.items() if k not in ("type", "skip", "limit")}
    rels = rel_service.get_relationships(rel_type, skip, limit, filters or None)
    return ok(rels)


# Bulk before parameterized to give static route priority
@rels_bp.patch("/properties/bulk")
def bulk_update_props():
    payload = BulkRelUpdatePayload(**request.get_json(force=True))
    items = [i.model_dump() for i in payload.items]
    result = rel_service.bulk_update_rel_props(items)
    return ok(result)


@rels_bp.patch("/<rel_id>/properties")
def update_props(rel_id):
    payload = UpdateRelPropsPayload(**request.get_json(force=True))
    rel = rel_service.update_rel_props(rel_id, payload.properties)
    return ok(rel)


@rels_bp.delete("/properties/bulk")
def bulk_delete_props():
    payload = BulkRelRemovePayload(**request.get_json(force=True))
    items = [i.model_dump() for i in payload.items]
    result = rel_service.bulk_delete_rel_props(items)
    return ok(result)


@rels_bp.delete("/<rel_id>/properties")
def delete_props(rel_id):
    payload = RemoveRelPropsPayload(**request.get_json(force=True))
    rel = rel_service.delete_rel_props(rel_id, payload.keys)
    return ok(rel)


@rels_bp.delete("/<rel_id>")
def delete_rel(rel_id):
    rel_service.delete_relationship(rel_id)
    return ok({"deleted": rel_id})


@rels_bp.delete("")
def delete_rels():
    data = request.get_json(force=True)
    rel_type = data.get("type", "")
    filters = data.get("filters")
    count = rel_service.delete_relationships(rel_type, filters)
    return ok({"deleted": count})
