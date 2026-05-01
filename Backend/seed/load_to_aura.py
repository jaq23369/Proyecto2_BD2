"""
Carga los 24 CSVs de seed/data/ directamente a AuraDB sin levantar Flask.
Uso:
    cd Backend
    source .venv/bin/activate
    python seed/load_to_aura.py
"""
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import pandas as pd
from services.csv_service import load_nodes, load_relationships, load_about_relationships
from db.neo4j_client import run_read

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _node(csv_name: str, label: str) -> int:
    path = os.path.join(DATA_DIR, csv_name)
    if not os.path.exists(path):
        print(f"  SKIP {csv_name} (not found)")
        return 0
    df = pd.read_csv(path)
    n = load_nodes(df, label)
    print(f"  {csv_name}: {n} rows → {label}")
    return n


def _rel(csv_name: str, rel_type: str, from_label: str, to_label: str,
         from_col: str, to_col: str) -> int:
    path = os.path.join(DATA_DIR, csv_name)
    if not os.path.exists(path):
        print(f"  SKIP {csv_name} (not found)")
        return 0
    df = pd.read_csv(path)
    n = load_relationships(df, rel_type, from_label, to_label, from_col, to_col)
    print(f"  {csv_name}: {n} rows → {rel_type}")
    return n


def main() -> None:
    t0 = time.time()

    print("=== Loading nodes ===")
    total_nodes = 0
    total_nodes += _node("users.csv",         "User")
    total_nodes += _node("posts.csv",         "Post")
    total_nodes += _node("comments.csv",      "Comment")
    total_nodes += _node("hashtags.csv",      "Hashtag")
    total_nodes += _node("groups.csv",        "Group")
    total_nodes += _node("messages.csv",      "Message")
    total_nodes += _node("media.csv",         "Media")
    total_nodes += _node("notifications.csv", "Notification")

    print("\n=== Loading relationships ===")
    _rel("follows.csv",        "FOLLOWS",    "User",    "User",         "fromUserId",    "toUserId")
    _rel("blocked.csv",        "BLOCKED",    "User",    "User",         "fromUserId",    "toUserId")
    _rel("posted.csv",         "POSTED",     "User",    "Post",         "userId",        "postId")
    _rel("liked.csv",          "LIKED",      "User",    "Post",         "userId",        "postId")
    _rel("commented.csv",      "COMMENTED",  "User",    "Comment",      "userId",        "commentId")
    _rel("contains.csv",       "CONTAINS",   "Post",    "Comment",      "postId",        "commentId")
    _rel("replied_to.csv",     "REPLIED_TO", "Comment", "Comment",      "fromCommentId", "toCommentId")
    _rel("tagged_with.csv",    "TAGGED_WITH","Post",    "Hashtag",      "postId",        "hashtagName")
    _rel("member_of.csv",      "MEMBER_OF",  "User",    "Group",        "userId",        "groupId")
    _rel("sent.csv",           "SENT",       "User",    "Message",      "userId",        "messageId")
    _rel("has_media_post.csv", "HAS_MEDIA",  "Post",    "Media",        "postId",        "mediaId")
    _rel("has_media_msg.csv",  "HAS_MEDIA",  "Message", "Media",        "messageId",     "mediaId")
    _rel("received.csv",       "RECEIVED",   "User",    "Notification", "userId",        "notificationId")
    _rel("saved.csv",          "SAVED",      "User",    "Post",         "userId",        "postId")
    _rel("shared_in.csv",      "SHARED_IN",  "Post",    "Group",        "postId",        "groupId")

    about_path = os.path.join(DATA_DIR, "about.csv")
    if os.path.exists(about_path):
        df_about = pd.read_csv(about_path)
        n = load_about_relationships(df_about)
        print(f"  about.csv: {n} rows → ABOUT")

    print("\n=== Verification ===")
    rows = run_read(
        "MATCH (n) WITH labels(n) AS lbls, count(*) AS cnt "
        "RETURN lbls[0] AS label, cnt ORDER BY cnt DESC"
    )
    total_in_db = sum(r["cnt"] for r in rows)
    for r in rows:
        print(f"  {r['label']}: {r['cnt']}")
    print(f"\nTotal nodes in AuraDB : {total_in_db}")
    print(f"Elapsed               : {round(time.time() - t0, 1)}s")
    print("Done." if total_in_db >= 5000 else "WARNING: less than 5000 nodes!")


if __name__ == "__main__":
    main()
