import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")


class CreatePostPayload(BaseModel):
    userId: str
    content: str
    location: str = ""
    mediaUrls: list[str] = []
    isPublic: bool = True

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be empty")
        return v


class UpdatePostPayload(BaseModel):
    content: str | None = None
    location: str | None = None
    isPublic: bool | None = None
    mediaUrls: list[str] | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@posts_bp.post("")
def create_post():
    payload = CreatePostPayload(**request.get_json(force=True))
    now = date.today().isoformat()
    post_id = str(uuid.uuid4())
    props = {
        "postId": post_id,
        "content": payload.content,
        "location": payload.location,
        "mediaUrls": payload.mediaUrls,
        "isPublic": payload.isPublic,
        "likesCount": 0,
        "commentsCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    rows = run_write(
        "MATCH (u:User {userId: $uid}) "
        "CREATE (p:Post $props) "
        "CREATE (u)-[:POSTED {postedAt: $now, device: 'api', location: $loc}]->(p) "
        "RETURN p",
        {"uid": payload.userId, "props": props, "now": now, "loc": payload.location},
    )
    if not rows:
        raise NotFoundError(f"User '{payload.userId}' not found")
    return created(rows[0]["p"])


@posts_bp.get("")
def list_posts():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Post) RETURN n ORDER BY n.createdAt DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@posts_bp.get("/<post_id>")
def get_post(post_id):
    rows = run_read("MATCH (n:Post {postId: $id}) RETURN n", {"id": post_id})
    if not rows:
        raise NotFoundError(f"Post '{post_id}' not found")
    return ok(rows[0]["n"])


@posts_bp.patch("/<post_id>")
def update_post(post_id):
    payload = UpdatePostPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    props["updatedAt"] = date.today().isoformat()
    rows = run_write(
        "MATCH (n:Post {postId: $id}) SET n += $props RETURN n",
        {"id": post_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Post '{post_id}' not found")
    return ok(rows[0]["n"])


@posts_bp.delete("/<post_id>")
def delete_post(post_id):
    run_write("MATCH (n:Post {postId: $id}) DETACH DELETE n", {"id": post_id})
    return ok({"deleted": post_id})


# ── Acciones ──────────────────────────────────────────────────────────────────

@posts_bp.post("/<post_id>/like")
def like_post(post_id):
    data = request.get_json(force=True) or {}
    user_id = data.get("userId", "")
    now = date.today().isoformat()
    run_write(
        "MATCH (u:User {userId: $uid}), (p:Post {postId: $pid}) "
        "MERGE (u)-[r:LIKED]->(p) "
        "ON CREATE SET r.likedAt = $now, r.reactionType = 'like', r.isActive = true",
        {"uid": user_id, "pid": post_id, "now": now},
    )
    return ok({"liked": post_id})


@posts_bp.delete("/<post_id>/like")
def unlike_post(post_id):
    data = request.get_json(force=True) or {}
    user_id = data.get("userId", "")
    run_write(
        "MATCH (u:User {userId: $uid})-[r:LIKED]->(p:Post {postId: $pid}) DELETE r",
        {"uid": user_id, "pid": post_id},
    )
    return ok({"unliked": post_id})


@posts_bp.get("/<post_id>/comments")
def get_comments(post_id):
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (p:Post {postId: $pid})-[:CONTAINS]->(c:Comment) "
        "RETURN c ORDER BY c.createdAt DESC LIMIT $limit",
        {"pid": post_id, "limit": limit},
    )
    return ok([r["c"] for r in rows])


@posts_bp.post("/<post_id>/tag/<hashtag_name>")
def tag_post(post_id, hashtag_name):
    now = date.today().isoformat()
    run_write(
        "MATCH (p:Post {postId: $pid}), (h:Hashtag {name: $hname}) "
        "MERGE (p)-[r:TAGGED_WITH]->(h) "
        "ON CREATE SET r.taggedAt = $now, r.relevanceScore = 1.0, r.isPrimary = false",
        {"pid": post_id, "hname": hashtag_name, "now": now},
    )
    return ok({"tagged": hashtag_name})


@posts_bp.post("/<post_id>/save")
def save_post(post_id):
    data = request.get_json(force=True) or {}
    user_id = data.get("userId", "")
    now = date.today().isoformat()
    run_write(
        "MATCH (u:User {userId: $uid}), (p:Post {postId: $pid}) "
        "MERGE (u)-[r:SAVED]->(p) "
        "ON CREATE SET r.savedAt = $now, r.isPrivate = false, r.note = ''",
        {"uid": user_id, "pid": post_id, "now": now},
    )
    return ok({"saved": post_id})


@posts_bp.post("/<post_id>/share/<group_id>")
def share_post(post_id, group_id):
    now = date.today().isoformat()
    run_write(
        "MATCH (p:Post {postId: $pid}), (g:Group {groupId: $gid}) "
        "MERGE (p)-[r:SHARED_IN]->(g) "
        "ON CREATE SET r.sharedAt = $now, r.visibleToMembers = true, r.caption = ''",
        {"pid": post_id, "gid": group_id, "now": now},
    )
    return ok({"shared_in": group_id})


@posts_bp.get("/<post_id>/media")
def get_media(post_id):
    rows = run_read(
        "MATCH (p:Post {postId: $pid})-[:HAS_MEDIA]->(m:Media) RETURN m",
        {"pid": post_id},
    )
    return ok([r["m"] for r in rows])
