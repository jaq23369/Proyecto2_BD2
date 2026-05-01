import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


class CreateUserPayload(BaseModel):
    username: str
    email: str
    bio: str = ""
    profilePicUrl: str = ""
    isVerified: bool = False
    followersCount: int = 0
    followingCount: int = 0
    interests: list[str] = []
    birthDate: str = ""

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("username must not be empty")
        return v


class UpdateUserPayload(BaseModel):
    bio: str | None = None
    profilePicUrl: str | None = None
    isVerified: bool | None = None
    followersCount: int | None = None
    followingCount: int | None = None
    interests: list[str] | None = None
    username: str | None = None
    email: str | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@users_bp.post("")
def create_user():
    payload = CreateUserPayload(**request.get_json(force=True))
    props = payload.model_dump()
    props["userId"] = str(uuid.uuid4())
    props["createdAt"] = date.today().isoformat()
    row = run_write(
        "CREATE (n:User $props) RETURN n",
        {"props": props},
    )
    return created(row[0]["n"])


@users_bp.get("")
def list_users():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:User) RETURN n SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@users_bp.get("/<user_id>")
def get_user(user_id):
    rows = run_read("MATCH (n:User {userId: $id}) RETURN n", {"id": user_id})
    if not rows:
        raise NotFoundError(f"User '{user_id}' not found")
    return ok(rows[0]["n"])


@users_bp.patch("/<user_id>")
def update_user(user_id):
    payload = UpdateUserPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not props:
        raise ValueError("No fields to update")
    rows = run_write(
        "MATCH (n:User {userId: $id}) SET n += $props RETURN n",
        {"id": user_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"User '{user_id}' not found")
    return ok(rows[0]["n"])


@users_bp.delete("/<user_id>")
def delete_user(user_id):
    run_write("MATCH (n:User {userId: $id}) DETACH DELETE n", {"id": user_id})
    return ok({"deleted": user_id})


# ── Acciones de relación ──────────────────────────────────────────────────────

@users_bp.post("/<user_id>/follow/<target_id>")
def follow(user_id, target_id):
    rows = run_write(
        "MATCH (a:User {userId: $uid}), (b:User {userId: $tid}) "
        "MERGE (a)-[r:FOLLOWS]->(b) "
        "ON CREATE SET r.since = $today, r.notificationsEnabled = true, r.mutualFriendsCount = 0 "
        "RETURN r",
        {"uid": user_id, "tid": target_id, "today": date.today().isoformat()},
    )
    return ok({"followed": target_id})


@users_bp.delete("/<user_id>/follow/<target_id>")
def unfollow(user_id, target_id):
    run_write(
        "MATCH (a:User {userId: $uid})-[r:FOLLOWS]->(b:User {userId: $tid}) DELETE r",
        {"uid": user_id, "tid": target_id},
    )
    return ok({"unfollowed": target_id})


@users_bp.post("/<user_id>/block/<target_id>")
def block(user_id, target_id):
    run_write(
        "MATCH (a:User {userId: $uid}), (b:User {userId: $tid}) "
        "MERGE (a)-[r:BLOCKED]->(b) "
        "ON CREATE SET r.blockedAt = $today, r.reason = 'user_action', r.isPermanent = false",
        {"uid": user_id, "tid": target_id, "today": date.today().isoformat()},
    )
    return ok({"blocked": target_id})


@users_bp.delete("/<user_id>/block/<target_id>")
def unblock(user_id, target_id):
    run_write(
        "MATCH (a:User {userId: $uid})-[r:BLOCKED]->(b:User {userId: $tid}) DELETE r",
        {"uid": user_id, "tid": target_id},
    )
    return ok({"unblocked": target_id})


@users_bp.post("/<user_id>/join/<group_id>")
def join_group(user_id, group_id):
    run_write(
        "MATCH (u:User {userId: $uid}), (g:Group {groupId: $gid}) "
        "MERGE (u)-[r:MEMBER_OF]->(g) "
        "ON CREATE SET r.joinedAt = $today, r.role = 'member', r.contributionScore = 0.0",
        {"uid": user_id, "gid": group_id, "today": date.today().isoformat()},
    )
    return ok({"joined": group_id})


@users_bp.delete("/<user_id>/join/<group_id>")
def leave_group(user_id, group_id):
    run_write(
        "MATCH (u:User {userId: $uid})-[r:MEMBER_OF]->(g:Group {groupId: $gid}) DELETE r",
        {"uid": user_id, "gid": group_id},
    )
    return ok({"left": group_id})


# ── Consultas ─────────────────────────────────────────────────────────────────

@users_bp.get("/<user_id>/feed")
def feed(user_id):
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (u:User {userId: $uid})-[:FOLLOWS]->(f:User)-[:POSTED]->(p:Post) "
        "RETURN p ORDER BY p.createdAt DESC LIMIT $limit",
        {"uid": user_id, "limit": limit},
    )
    return ok([r["p"] for r in rows])


@users_bp.get("/<user_id>/followers")
def followers(user_id):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (f:User)-[:FOLLOWS]->(u:User {userId: $uid}) "
        "RETURN f SKIP $skip LIMIT $limit",
        {"uid": user_id, "skip": skip, "limit": limit},
    )
    return ok([r["f"] for r in rows])


@users_bp.get("/<user_id>/following")
def following(user_id):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (u:User {userId: $uid})-[:FOLLOWS]->(f:User) "
        "RETURN f SKIP $skip LIMIT $limit",
        {"uid": user_id, "skip": skip, "limit": limit},
    )
    return ok([r["f"] for r in rows])
