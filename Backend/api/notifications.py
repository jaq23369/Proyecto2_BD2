import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


class CreateNotificationPayload(BaseModel):
    userId: str
    type: str
    message: str
    priority: str = "medium"
    targetId: str | None = None
    targetType: str | None = None  # "Post" | "Comment"

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message must not be empty")
        return v


class UpdateNotificationPayload(BaseModel):
    isRead: bool | None = None
    priority: str | None = None
    message: str | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@notifications_bp.post("")
def create_notification():
    payload = CreateNotificationPayload(**request.get_json(force=True))
    now = date.today().isoformat()
    notif_id = str(uuid.uuid4())
    props = {
        "notificationId": notif_id,
        "type": payload.type,
        "isRead": False,
        "priority": payload.priority,
        "message": payload.message,
        "createdAt": now,
    }
    cypher = (
        "MATCH (u:User {userId: $uid}) "
        "CREATE (n:Notification $props) "
        "CREATE (u)-[:RECEIVED {receivedAt: $now, isRead: false, notificationType: $ntype}]->(n) "
        "RETURN n"
    )
    rows = run_write(cypher, {
        "uid": payload.userId, "props": props,
        "now": now, "ntype": payload.type,
    })
    if not rows:
        raise NotFoundError(f"User '{payload.userId}' not found")

    # Optionally link to Post or Comment via ABOUT
    if payload.targetId and payload.targetType in ("Post", "Comment"):
        id_prop = "postId" if payload.targetType == "Post" else "commentId"
        run_write(
            f"MATCH (notif:Notification {{notificationId: $nid}}), "
            f"(t:{payload.targetType} {{{id_prop}: $tid}}) "
            f"MERGE (notif)-[r:ABOUT]->(t) "
            f"SET r.linkedAt = $now, r.context = '', r.targetType = $ttype",
            {"nid": notif_id, "tid": payload.targetId,
             "now": now, "ttype": payload.targetType},
        )

    return created(rows[0]["n"])


@notifications_bp.get("")
def list_notifications():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Notification) RETURN n ORDER BY n.createdAt DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@notifications_bp.get("/<notif_id>")
def get_notification(notif_id):
    rows = run_read(
        "MATCH (n:Notification {notificationId: $id}) RETURN n", {"id": notif_id}
    )
    if not rows:
        raise NotFoundError(f"Notification '{notif_id}' not found")
    return ok(rows[0]["n"])


@notifications_bp.patch("/<notif_id>")
def update_notification(notif_id):
    payload = UpdateNotificationPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    rows = run_write(
        "MATCH (n:Notification {notificationId: $id}) SET n += $props RETURN n",
        {"id": notif_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Notification '{notif_id}' not found")
    return ok(rows[0]["n"])


@notifications_bp.delete("/<notif_id>")
def delete_notification(notif_id):
    run_write(
        "MATCH (n:Notification {notificationId: $id}) DETACH DELETE n", {"id": notif_id}
    )
    return ok({"deleted": notif_id})


# ── About ─────────────────────────────────────────────────────────────────────

@notifications_bp.get("/<notif_id>/about")
def about(notif_id):
    rows = run_read(
        "MATCH (n:Notification {notificationId: $nid})-[r:ABOUT]->(t) "
        "RETURN t, labels(t) AS targetLabels, r.targetType AS targetType",
        {"nid": notif_id},
    )
    return ok([
        {"target": r["t"], "targetType": r["targetType"], "labels": r["targetLabels"]}
        for r in rows
    ])
