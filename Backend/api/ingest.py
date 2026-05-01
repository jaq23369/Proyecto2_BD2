import os
import io

import pandas as pd
from flask import Blueprint, request

from db.neo4j_client import run_read
from services import csv_service
from utils.errors import ValidationFailed
from utils.responses import ok, created

ingest_bp = Blueprint("ingest", __name__, url_prefix="/api/ingest")

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "seed", "data")

# ── CSV upload ────────────────────────────────────────────────────────────────

@ingest_bp.post("/csv")
def upload_csv():
    """
    Multipart fields:
      file       — CSV file
      target     — label (mode=nodes) or rel_type (mode=relationships)
      mode       — 'nodes' | 'relationships'
    Extra fields for mode=relationships:
      from_label, to_label, from_id_col, to_id_col
    """
    if "file" not in request.files:
        raise ValidationFailed("Missing 'file' field")
    f = request.files["file"]
    target = request.form.get("target", "")
    mode = request.form.get("mode", "nodes")

    if not target:
        raise ValidationFailed("Missing 'target' field")

    df = pd.read_csv(io.StringIO(f.stream.read().decode("utf-8")))

    if mode == "nodes":
        count = csv_service.load_nodes(df, target)
        return ok({"loaded": count, "label": target})

    if mode == "relationships":
        from_label = request.form.get("from_label", "")
        to_label = request.form.get("to_label", "")
        from_id_col = request.form.get("from_id_col", "")
        to_id_col = request.form.get("to_id_col", "")
        if not all([from_label, to_label, from_id_col, to_id_col]):
            raise ValidationFailed(
                "Relationship mode requires: from_label, to_label, from_id_col, to_id_col"
            )
        count = csv_service.load_relationships(
            df, target, from_label, to_label, from_id_col, to_id_col
        )
        return ok({"loaded": count, "type": target})

    raise ValidationFailed(f"Unknown mode '{mode}'. Use 'nodes' or 'relationships'")


# ── Full seed ─────────────────────────────────────────────────────────────────

@ingest_bp.post("/seed")
def run_seed():
    """Load all 24 seed CSVs from seed/data/ into AuraDB (idempotent via MERGE)."""
    results = _load_all_csvs()
    return ok(results)


# ── Status ────────────────────────────────────────────────────────────────────

@ingest_bp.get("/status")
def status():
    rows = run_read(
        "MATCH (n) "
        "WITH labels(n) AS lbls, count(*) AS cnt "
        "RETURN lbls[0] AS label, cnt "
        "ORDER BY cnt DESC"
    )
    total = sum(r["cnt"] for r in rows)
    return ok({"total": total, "by_label": rows})


# ── Internal loader (shared with seed/load_to_aura.py) ───────────────────────

def _load_all_csvs() -> dict:
    results: dict[str, int] = {}

    def _load_node(csv_name: str, label: str) -> None:
        path = os.path.join(DATA_DIR, csv_name)
        if not os.path.exists(path):
            results[csv_name] = 0
            return
        df = pd.read_csv(path)
        results[csv_name] = csv_service.load_nodes(df, label)

    def _load_rel(csv_name: str, rel_type: str, from_label: str, to_label: str,
                  from_col: str, to_col: str) -> None:
        path = os.path.join(DATA_DIR, csv_name)
        if not os.path.exists(path):
            results[csv_name] = 0
            return
        df = pd.read_csv(path)
        results[csv_name] = csv_service.load_relationships(
            df, rel_type, from_label, to_label, from_col, to_col
        )

    # Nodes
    _load_node("users.csv",         "User")
    _load_node("posts.csv",         "Post")
    _load_node("comments.csv",      "Comment")
    _load_node("hashtags.csv",      "Hashtag")
    _load_node("groups.csv",        "Group")
    _load_node("messages.csv",      "Message")
    _load_node("media.csv",         "Media")
    _load_node("notifications.csv", "Notification")

    # Relationships
    _load_rel("follows.csv",       "FOLLOWS",   "User",         "User",         "fromUserId",     "toUserId")
    _load_rel("blocked.csv",       "BLOCKED",   "User",         "User",         "fromUserId",     "toUserId")
    _load_rel("posted.csv",        "POSTED",    "User",         "Post",         "userId",         "postId")
    _load_rel("liked.csv",         "LIKED",     "User",         "Post",         "userId",         "postId")
    _load_rel("commented.csv",     "COMMENTED", "User",         "Comment",      "userId",         "commentId")
    _load_rel("contains.csv",      "CONTAINS",  "Post",         "Comment",      "postId",         "commentId")
    _load_rel("replied_to.csv",    "REPLIED_TO","Comment",      "Comment",      "fromCommentId",  "toCommentId")
    _load_rel("tagged_with.csv",   "TAGGED_WITH","Post",        "Hashtag",      "postId",         "hashtagName")
    _load_rel("member_of.csv",     "MEMBER_OF", "User",         "Group",        "userId",         "groupId")
    _load_rel("sent.csv",          "SENT",      "User",         "Message",      "userId",         "messageId")
    _load_rel("has_media_post.csv","HAS_MEDIA", "Post",         "Media",        "postId",         "mediaId")
    _load_rel("has_media_msg.csv", "HAS_MEDIA", "Message",      "Media",        "messageId",      "mediaId")
    _load_rel("received.csv",      "RECEIVED",  "User",         "Notification", "userId",         "notificationId")
    _load_rel("saved.csv",         "SAVED",     "User",         "Post",         "userId",         "postId")
    _load_rel("shared_in.csv",     "SHARED_IN", "Post",         "Group",        "postId",         "groupId")

    # Special: about.csv (mixed Post/Comment target)
    about_path = os.path.join(DATA_DIR, "about.csv")
    if os.path.exists(about_path):
        df_about = pd.read_csv(about_path)
        results["about.csv"] = csv_service.load_about_relationships(df_about)
    else:
        results["about.csv"] = 0

    return results
