import uuid
from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

groups_bp = Blueprint("groups", __name__, url_prefix="/api/groups")


class CreateGroupPayload(BaseModel):
    name: str
    description: str = ""
    isPrivate: bool = False
    categories: list[str] = []

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v


class UpdateGroupPayload(BaseModel):
    name: str | None = None
    description: str | None = None
    isPrivate: bool | None = None
    categories: list[str] | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@groups_bp.post("")
def create_group():
    payload = CreateGroupPayload(**request.get_json(force=True))
    props = payload.model_dump()
    props["groupId"] = str(uuid.uuid4())
    props["membersCount"] = 0
    props["createdAt"] = date.today().isoformat()
    rows = run_write("CREATE (n:Group $props) RETURN n", {"props": props})
    return created(rows[0]["n"])


@groups_bp.get("")
def list_groups():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Group) RETURN n ORDER BY n.membersCount DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@groups_bp.get("/<group_id>")
def get_group(group_id):
    rows = run_read("MATCH (n:Group {groupId: $id}) RETURN n", {"id": group_id})
    if not rows:
        raise NotFoundError(f"Group '{group_id}' not found")
    return ok(rows[0]["n"])


@groups_bp.patch("/<group_id>")
def update_group(group_id):
    payload = UpdateGroupPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    rows = run_write(
        "MATCH (n:Group {groupId: $id}) SET n += $props RETURN n",
        {"id": group_id, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Group '{group_id}' not found")
    return ok(rows[0]["n"])


@groups_bp.delete("/<group_id>")
def delete_group(group_id):
    run_write("MATCH (n:Group {groupId: $id}) DETACH DELETE n", {"id": group_id})
    return ok({"deleted": group_id})


# ── Miembros y posts compartidos ──────────────────────────────────────────────

@groups_bp.get("/<group_id>/members")
def members(group_id):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (u:User)-[r:MEMBER_OF]->(g:Group {groupId: $gid}) "
        "RETURN u, r.role AS role SKIP $skip LIMIT $limit",
        {"gid": group_id, "skip": skip, "limit": limit},
    )
    return ok([{"user": r["u"], "role": r["role"]} for r in rows])


@groups_bp.get("/<group_id>/posts")
def shared_posts(group_id):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (p:Post)-[:SHARED_IN]->(g:Group {groupId: $gid}) "
        "RETURN p ORDER BY p.createdAt DESC SKIP $skip LIMIT $limit",
        {"gid": group_id, "skip": skip, "limit": limit},
    )
    return ok([r["p"] for r in rows])
