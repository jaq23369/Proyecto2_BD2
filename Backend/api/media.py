import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

media_bp = Blueprint("media", __name__, url_prefix="/api/media")


class CreateMediaPayload(BaseModel):
    url: str
    type: str
    sizeKB: float = 0.0
    format: str = ""

    @field_validator("url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("url must not be empty")
        return v


class UpdateMediaPayload(BaseModel):
    url: str | None = None
    type: str | None = None
    sizeKB: float | None = None
    format: str | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@media_bp.post("")
def create_media():
    payload = CreateMediaPayload(**request.get_json(force=True))
    props = payload.model_dump()
    props["mediaId"] = str(uuid.uuid4())
    props["uploadedAt"] = date.today().isoformat()
    rows = run_write("CREATE (n:Media $props) RETURN n", {"props": props})
    return created(rows[0]["n"])


@media_bp.get("")
def list_media():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Media) RETURN n ORDER BY n.uploadedAt DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@media_bp.get("/<media_id>")
def get_media(media_id):
    rows = run_read("MATCH (n:Media {mediaId: $id}) RETURN n", {"id": media_id})
    if not rows:
        raise NotFoundError(f"Media '{media_id}' not found")
    return ok(rows[0]["n"])


@media_bp.patch("/<media_id>")
def update_media(media_id):
    payload = UpdateMediaPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    rows = run_write(
        "MATCH (n:Media {mediaId: $id}) SET n += $props RETURN n",
        {"id": media_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Media '{media_id}' not found")
    return ok(rows[0]["n"])


@media_bp.delete("/<media_id>")
def delete_media(media_id):
    run_write("MATCH (n:Media {mediaId: $id}) DETACH DELETE n", {"id": media_id})
    return ok({"deleted": media_id})


# ── Asociar a Post o Message ──────────────────────────────────────────────────

@media_bp.post("/<media_id>/attach/post/<post_id>")
def attach_to_post(media_id, post_id):
    now = date.today().isoformat()
    run_write(
        "MATCH (m:Media {mediaId: $mid}), (p:Post {postId: $pid}) "
        "MERGE (p)-[r:HAS_MEDIA]->(m) "
        "ON CREATE SET r.attachedAt = $now, r.isPrimary = false, r.caption = ''",
        {"mid": media_id, "pid": post_id, "now": now},
    )
    return ok({"attached_to_post": post_id})


@media_bp.post("/<media_id>/attach/message/<msg_id>")
def attach_to_message(media_id, msg_id):
    now = date.today().isoformat()
    run_write(
        "MATCH (m:Media {mediaId: $mid}), (msg:Message {messageId: $msid}) "
        "MERGE (msg)-[r:HAS_MEDIA]->(m) "
        "ON CREATE SET r.attachedAt = $now, r.isPrimary = false, r.caption = ''",
        {"mid": media_id, "msid": msg_id, "now": now},
    )
    return ok({"attached_to_message": msg_id})
