from datetime import date

from flask import Blueprint, request
from pydantic import BaseModel, field_validator

from db.neo4j_client import run_read, run_write
from utils.errors import NotFoundError
from utils.responses import ok, created

hashtags_bp = Blueprint("hashtags", __name__, url_prefix="/api/hashtags")


class CreateHashtagPayload(BaseModel):
    name: str
    postsCount: int = 0
    followersCount: int = 0
    isTrending: bool = False
    relatedTopics: list[str] = []

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v.lower()


class UpdateHashtagPayload(BaseModel):
    postsCount: int | None = None
    followersCount: int | None = None
    isTrending: bool | None = None
    relatedTopics: list[str] | None = None


# ── CRUD ─────────────────────────────────────────────────────────────────────

@hashtags_bp.post("")
def create_hashtag():
    payload = CreateHashtagPayload(**request.get_json(force=True))
    props = payload.model_dump()
    props["createdAt"] = date.today().isoformat()
    rows = run_write(
        "MERGE (n:Hashtag {name: $name}) SET n += $props RETURN n",
        {"name": props["name"], "props": props},
    )
    return created(rows[0]["n"])


@hashtags_bp.get("")
def list_hashtags():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (n:Hashtag) RETURN n ORDER BY n.postsCount DESC SKIP $skip LIMIT $limit",
        {"skip": skip, "limit": limit},
    )
    return ok([r["n"] for r in rows])


@hashtags_bp.get("/<name>")
def get_hashtag(name):
    rows = run_read("MATCH (n:Hashtag {name: $name}) RETURN n", {"name": name})
    if not rows:
        raise NotFoundError(f"Hashtag '{name}' not found")
    return ok(rows[0]["n"])


@hashtags_bp.patch("/<name>")
def update_hashtag(name):
    payload = UpdateHashtagPayload(**request.get_json(force=True))
    props = {k: v for k, v in payload.model_dump().items() if v is not None}
    rows = run_write(
        "MATCH (n:Hashtag {name: $name}) SET n += $props RETURN n",
        {"name": name, "props": props},
    )
    if not rows:
        raise NotFoundError(f"Hashtag '{name}' not found")
    return ok(rows[0]["n"])


@hashtags_bp.delete("/<name>")
def delete_hashtag(name):
    run_write("MATCH (n:Hashtag {name: $name}) DETACH DELETE n", {"name": name})
    return ok({"deleted": name})


# ── Posts asociados ───────────────────────────────────────────────────────────

@hashtags_bp.get("/<name>/posts")
def hashtag_posts(name):
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 20))
    rows = run_read(
        "MATCH (p:Post)-[:TAGGED_WITH]->(h:Hashtag {name: $name}) "
        "RETURN p ORDER BY p.createdAt DESC SKIP $skip LIMIT $limit",
        {"name": name, "skip": skip, "limit": limit},
    )
    return ok([r["p"] for r in rows])
