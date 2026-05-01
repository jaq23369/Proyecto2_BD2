from flask import Blueprint, request
from schemas.node_schemas import (
    CreateNodePayload, UpdatePropsPayload, RemovePropsPayload,
    BulkUpdatePayload, BulkRemovePayload,
)
from services import node_service
from utils.responses import ok, created

nodes_bp = Blueprint("nodes", __name__, url_prefix="/api/nodes")


@nodes_bp.post("")
def create_node():
    payload = CreateNodePayload(**request.get_json(force=True))
    node = node_service.create_node(payload.labels, payload.properties)
    return created(node)


@nodes_bp.get("/aggregate")
def aggregate():
    label = request.args.get("label", "")
    group_by = request.args.get("groupBy", "")
    result = node_service.aggregate_nodes(label, group_by)
    return ok(result)


@nodes_bp.get("/<label>/<node_id>")
def get_node(label, node_id):
    node = node_service.get_node(label, node_id)
    return ok(node)


@nodes_bp.get("")
def get_nodes():
    label = request.args.get("label", "")
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    filters = {k: v for k, v in request.args.items() if k not in ("label", "skip", "limit")}
    nodes = node_service.get_nodes(label, skip, limit, filters or None)
    return ok(nodes)


# Bulk before parameterized to give static route priority
@nodes_bp.patch("/properties/bulk")
def bulk_update_props():
    payload = BulkUpdatePayload(**request.get_json(force=True))
    items = [i.model_dump() for i in payload.items]
    result = node_service.bulk_update_node_props(items)
    return ok(result)


@nodes_bp.patch("/<label>/<node_id>/properties")
def update_props(label, node_id):
    payload = UpdatePropsPayload(**request.get_json(force=True))
    node = node_service.update_node_props(label, node_id, payload.properties)
    return ok(node)


@nodes_bp.delete("/properties/bulk")
def bulk_delete_props():
    payload = BulkRemovePayload(**request.get_json(force=True))
    items = [i.model_dump() for i in payload.items]
    result = node_service.bulk_delete_node_props(items)
    return ok(result)


@nodes_bp.delete("/<label>/<node_id>/properties")
def delete_props(label, node_id):
    payload = RemovePropsPayload(**request.get_json(force=True))
    node = node_service.delete_node_props(label, node_id, payload.keys)
    return ok(node)


@nodes_bp.delete("/<label>/<node_id>")
def delete_node(label, node_id):
    detach = request.args.get("detach", "true").lower() != "false"
    node_service.delete_node(label, node_id, detach)
    return ok({"deleted": node_id})


@nodes_bp.delete("")
def delete_nodes():
    data = request.get_json(force=True)
    label = data.get("label", "")
    ids = data.get("ids", [])
    count = node_service.delete_nodes(label, ids)
    return ok({"deleted": count})
