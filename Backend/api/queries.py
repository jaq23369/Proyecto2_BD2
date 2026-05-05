from flask import Blueprint, request

from db.neo4j_client import run_read
from utils.responses import ok

queries_bp = Blueprint("queries", __name__, url_prefix="/api/queries")


def _limit(default: int = 10, maximum: int = 100) -> int:
    value = int(request.args.get("limit", default))
    return max(1, min(value, maximum))


@queries_bp.get("/top-influencers")
def top_influencers():
    rows = run_read(
        "MATCH (u:User)<-[:FOLLOWS]-(f:User) "
        "RETURN u.userId AS userId, u.username AS username, count(f) AS followers "
        "ORDER BY followers DESC "
        "LIMIT $limit",
        {"limit": _limit()},
    )
    return ok(rows)


@queries_bp.get("/trending-hashtags")
def trending_hashtags():
    days = int(request.args.get("days", 30))
    rows = run_read(
        "MATCH (p:Post)-[:TAGGED_WITH]->(h:Hashtag) "
        "WHERE date(p.createdAt) >= date() - duration({days: $days}) "
        "RETURN h.name AS hashtag, count(p) AS uses "
        "ORDER BY uses DESC "
        "LIMIT $limit",
        {"days": days, "limit": _limit()},
    )
    return ok(rows)


@queries_bp.get("/most-liked-posts")
def most_liked_posts():
    rows = run_read(
        "MATCH (p:Post)<-[l:LIKED]-(:User) "
        "WHERE coalesce(l.isActive, true) = true "
        "OPTIONAL MATCH (author:User)-[:POSTED]->(p) "
        "RETURN p.postId AS postId, p.content AS content, author.username AS author, count(l) AS likes "
        "ORDER BY likes DESC "
        "LIMIT $limit",
        {"limit": _limit()},
    )
    return ok(rows)


@queries_bp.get("/largest-groups")
def largest_groups():
    rows = run_read(
        "MATCH (u:User)-[:MEMBER_OF]->(g:Group) "
        "RETURN g.groupId AS groupId, g.name AS name, g.description AS description, count(u) AS members "
        "ORDER BY members DESC "
        "LIMIT $limit",
        {"limit": _limit()},
    )
    return ok(rows)


@queries_bp.get("/negative-comments")
def negative_comments():
    rows = run_read(
        "MATCH (c:Comment) "
        "WHERE toLower(c.sentiment) = 'negative' "
        "OPTIONAL MATCH (u:User)-[:COMMENTED]->(c) "
        "RETURN c.commentId AS commentId, c.content AS content, u.username AS author, c.createdAt AS createdAt "
        "ORDER BY c.createdAt DESC "
        "LIMIT $limit",
        {"limit": _limit()},
    )
    return ok(rows)


@queries_bp.get("/most-active-users")
def most_active_users():
    rows = run_read(
        "MATCH (u:User) "
        "OPTIONAL MATCH (u)-[:POSTED]->(p:Post) "
        "WITH u, count(DISTINCT p) AS posts "
        "OPTIONAL MATCH (u)-[:COMMENTED]->(c:Comment) "
        "WITH u, posts, count(DISTINCT c) AS comments "
        "RETURN u.userId AS userId, u.username AS username, posts, comments, posts + comments AS activity "
        "ORDER BY activity DESC "
        "LIMIT $limit",
        {"limit": _limit()},
    )
    return ok(rows)
