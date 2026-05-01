import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

comments_bp = Blueprint("comments", __name__, url_prefix="/api/comments")


class CreateCommentPayload(BaseModel):
    userId: str
    postId: str
    content: str
    sentiment: str = "neutral"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be empty")
        return v


class UpdateCommentPayload(BaseModel):
    content: str | None = None
    sentiment: str | None = None


class ReplyPayload(BaseModel):
    userId: str
    postId: str
    content: str
    sentiment: str = "neutral"


# ── CRUD ─────────────────────────────────────────────────────────────────────

@comments_bp.post("")
def create_comment():
    payload = CreateCommentPayload(**request.get_json(force=True))
    now = date.today().isoformat()
    comment_id = str(uuid.uuid4())
    props = {
        "commentId": comment_id,
        "content": payload.content,
        "isEdited": False,
        "likesCount": 0,
        "sentiment": payload.sentiment,
        "createdAt": now,
        "updatedAt": now,
    }
    rows = run_write(
        "MATCH (u:User {userId: $uid}), (p:Post {postId: $pid}) "
        "CREATE (c:Comment $props) "
        "CREATE (u)-[:COMMENTED {commentedAt: $now, isFirstComment: false, device: 'api'}]->(c) "
        "CREATE (p)-[:CONTAINS {addedAt: $now, isVisible: true, moderationStatus: 'approved'}]->(c) "
        "RETURN c",
        {"uid": payload.userId, "pid": payload.postId, "props": props, "now": now},
    )
    if not rows:
        raise NotFoundError("User or Post not found")
    return created(rows[0]["c"])


@comments_bp.get("")
def list_comments():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Comment) RETURN n ORDER BY n.createdAt DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@comments_bp.get("/<comment_id>")
def get_comment(comment_id):
    rows = run_read("MATCH (n:Comment {commentId: $id}) RETURN n", {"id": comment_id})
    if not rows:
        raise NotFoundError(f"Comment '{comment_id}' not found")
    return ok(rows[0]["n"])


@comments_bp.patch("/<comment_id>")
def update_comment(comment_id):
    payload = UpdateCommentPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    props["isEdited"] = True
    props["updatedAt"] = date.today().isoformat()
    rows = run_write(
        "MATCH (n:Comment {commentId: $id}) SET n += $props RETURN n",
        {"id": comment_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Comment '{comment_id}' not found")
    return ok(rows[0]["n"])


@comments_bp.delete("/<comment_id>")
def delete_comment(comment_id):
    run_write("MATCH (n:Comment {commentId: $id}) DETACH DELETE n", {"id": comment_id})
    return ok({"deleted": comment_id})


# ── Acciones ──────────────────────────────────────────────────────────────────

@comments_bp.post("/<comment_id>/reply")
def reply(comment_id):
    payload = ReplyPayload(**request.get_json(force=True))
    now = date.today().isoformat()
    reply_id = str(uuid.uuid4())
    props = {
        "commentId": reply_id,
        "content": payload.content,
        "isEdited": False,
        "likesCount": 0,
        "sentiment": payload.sentiment,
        "createdAt": now,
        "updatedAt": now,
    }
    rows = run_write(
        "MATCH (u:User {userId: $uid}), (p:Post {postId: $pid}), "
        "(parent:Comment {commentId: $cid}) "
        "CREATE (c:Comment $props) "
        "CREATE (u)-[:COMMENTED {commentedAt: $now, isFirstComment: false, device: 'api'}]->(c) "
        "CREATE (p)-[:CONTAINS {addedAt: $now, isVisible: true, moderationStatus: 'approved'}]->(c) "
        "CREATE (c)-[:REPLIED_TO {repliedAt: $now, isDirectMention: true, notifiedParent: true}]->(parent) "
        "RETURN c",
        {"uid": payload.userId, "pid": payload.postId, "cid": comment_id,
         "props": props, "now": now},
    )
    if not rows:
        raise NotFoundError("User, Post, or parent Comment not found")
    return created(rows[0]["c"])
