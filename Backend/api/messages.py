import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

messages_bp = Blueprint("messages", __name__, url_prefix="/api/messages")


class CreateMessagePayload(BaseModel):
    fromUserId: str
    toUserId: str
    content: str
    isEncrypted: bool = False
    channel: str = "dm"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be empty")
        return v


class UpdateMessagePayload(BaseModel):
    content: str | None = None
    isRead: bool | None = None
    reactionType: str | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@messages_bp.post("")
def create_message():
    payload = CreateMessagePayload(**request.get_json(force=True))
    now = date.today().isoformat()
    msg_id = str(uuid.uuid4())
    props = {
        "messageId": msg_id,
        "content": payload.content,
        "isRead": False,
        "mediaUrl": "",
        "reactionType": "",
        "sentAt": now,
        "readAt": "",
    }
    rows = run_write(
        "MATCH (from:User {userId: $from_id}), (to:User {userId: $to_id}) "
        "CREATE (m:Message $props) "
        "CREATE (from)-[:SENT {sentAt: $now, isEncrypted: $enc, channel: $ch}]->(m) "
        "CREATE (to)-[:RECEIVED {receivedAt: $now, isRead: false, notificationType: 'message'}]->(m) "
        "RETURN m",
        {
            "from_id": payload.fromUserId, "to_id": payload.toUserId,
            "props": props, "now": now,
            "enc": payload.isEncrypted, "ch": payload.channel,
        },
    )
    if not rows:
        raise NotFoundError("Sender or receiver not found")
    return created(rows[0]["m"])


@messages_bp.get("")
def list_messages():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Message) RETURN n ORDER BY n.sentAt DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@messages_bp.get("/<msg_id>")
def get_message(msg_id):
    rows = run_read("MATCH (n:Message {messageId: $id}) RETURN n", {"id": msg_id})
    if not rows:
        raise NotFoundError(f"Message '{msg_id}' not found")
    return ok(rows[0]["n"])


@messages_bp.patch("/<msg_id>")
def update_message(msg_id):
    payload = UpdateMessagePayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    rows = run_write(
        "MATCH (n:Message {messageId: $id}) SET n += $props RETURN n",
        {"id": msg_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Message '{msg_id}' not found")
    return ok(rows[0]["n"])


@messages_bp.delete("/<msg_id>")
def delete_message(msg_id):
    run_write("MATCH (n:Message {messageId: $id}) DETACH DELETE n", {"id": msg_id})
    return ok({"deleted": msg_id})


# ── Sent / Received ───────────────────────────────────────────────────────────

@messages_bp.get("/sent/<user_id>")
def sent(user_id):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (u:User {userId: $uid})-[:SENT]->(m:Message) "
        "RETURN m ORDER BY m.sentAt DESC SKIP $skip LIMIT $limit",
        {"uid": user_id, "skip": skip, "limit": limit},
    )
    return ok([r["m"] for r in rows])


@messages_bp.get("/received/<user_id>")
def received(user_id):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (u:User {userId: $uid})-[:RECEIVED]->(m:Message) "
        "RETURN m ORDER BY m.sentAt DESC SKIP $skip LIMIT $limit",
        {"uid": user_id, "skip": skip, "limit": limit},
    )
    return ok([r["m"] for r in rows])
