"""
Genera 24 CSVs (8 nodos + 16 relaciones) para la Red Social en Neo4j.
Objetivo: 6720 nodos totales, grafo conexo validado con networkx.
"""
import csv
import json
import os
import random
import time
from datetime import date, timedelta

import networkx as nx
from faker import Faker

random.seed(42)
fake = Faker()
Faker.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ── Counts ──────────────────────────────────────────────────────────────────
N_USERS         = 1200
N_POSTS         = 1800
N_COMMENTS      = 1400
N_HASHTAGS      = 200
N_GROUPS        = 120
N_MESSAGES      = 500
N_MEDIA         = 300
N_NOTIFICATIONS = 1200

# ── ID pools ─────────────────────────────────────────────────────────────────
user_ids   = [f"u_{i}"     for i in range(N_USERS)]
post_ids   = [f"p_{i}"     for i in range(N_POSTS)]
comment_ids= [f"c_{i}"     for i in range(N_COMMENTS)]
group_ids  = [f"g_{i}"     for i in range(N_GROUPS)]
msg_ids    = [f"msg_{i}"   for i in range(N_MESSAGES)]
media_ids  = [f"med_{i}"   for i in range(N_MEDIA)]
notif_ids  = [f"notif_{i}" for i in range(N_NOTIFICATIONS)]

INTERESTS   = ["music","tech","sports","art","food","travel","gaming","fitness","science","fashion"]
REACTIONS   = ["like","love","haha","wow","sad","angry"]
SENTIMENTS  = ["positive","neutral","negative"]
DEVICES     = ["mobile","desktop","tablet"]
CHANNELS    = ["dm","group","broadcast"]
ROLES       = ["admin","moderator","member"]
MEDIA_TYPES = ["image","video","audio","document"]
FORMATS     = ["jpg","mp4","mp3","pdf","png","gif"]
NOTIF_TYPES = ["like","comment","follow","mention","share"]
PRIORITIES  = ["low","medium","high"]
MOD_STATUS  = ["approved","pending","removed"]


def rand_date(y0: int = 2020, y1: int = 2025) -> str:
    start = date(y0, 1, 1)
    delta = (date(y1, 12, 31) - start).days
    return (start + timedelta(days=random.randint(0, delta))).isoformat()


def rand_later(base: str) -> str:
    d = date.fromisoformat(base)
    return (d + timedelta(days=random.randint(1, 365))).isoformat()


def write_csv(name: str, rows: list[dict], fieldnames: list[str]) -> None:
    path = os.path.join(DATA_DIR, name)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  {name}: {len(rows)} rows")


# ── NODE CSVs ────────────────────────────────────────────────────────────────

def gen_users() -> None:
    rows = []
    usernames = set()
    emails = set()
    for uid in user_ids:
        while True:
            uname = fake.user_name() + str(random.randint(1, 9999))
            if uname not in usernames:
                usernames.add(uname)
                break
        while True:
            em = fake.email()
            if em not in emails:
                emails.add(em)
                break
        created = rand_date(2020, 2024)
        rows.append({
            "userId":         uid,
            "username":       uname,
            "email":          em,
            "bio":            fake.text(max_nb_chars=80).replace("\n", " "),
            "profilePicUrl":  fake.image_url(),
            "isVerified":     str(random.choice([True, False])).lower(),
            "followersCount": random.randint(0, 50000),
            "followingCount": random.randint(0, 2000),
            "interests":      json.dumps(random.sample(INTERESTS, k=random.randint(1, 4))),
            "birthDate":      rand_date(1970, 2005),
            "createdAt":      created,
        })
    write_csv("users.csv", rows, list(rows[0].keys()))


def gen_posts() -> None:
    rows = []
    for pid in post_ids:
        created = rand_date(2021, 2025)
        rows.append({
            "postId":        pid,
            "content":       fake.text(max_nb_chars=200).replace("\n", " "),
            "location":      fake.city(),
            "mediaUrls":     json.dumps([fake.image_url() for _ in range(random.randint(0, 3))]),
            "isPublic":      str(random.choice([True, False])).lower(),
            "likesCount":    random.randint(0, 10000),
            "commentsCount": random.randint(0, 500),
            "createdAt":     created,
            "updatedAt":     rand_later(created),
        })
    write_csv("posts.csv", rows, list(rows[0].keys()))


def gen_comments() -> None:
    rows = []
    for cid in comment_ids:
        created = rand_date(2021, 2025)
        rows.append({
            "commentId":  cid,
            "content":    fake.sentence(),
            "isEdited":   str(random.choice([True, False])).lower(),
            "likesCount": random.randint(0, 1000),
            "sentiment":  random.choice(SENTIMENTS),
            "createdAt":  created,
            "updatedAt":  rand_later(created),
        })
    write_csv("comments.csv", rows, list(rows[0].keys()))


def gen_hashtags() -> list[str]:
    names = []
    seen = set()
    while len(names) < N_HASHTAGS:
        n = fake.word().lower() + str(random.randint(1, 999))
        if n not in seen:
            seen.add(n)
            names.append(n)
    rows = []
    for name in names:
        rows.append({
            "name":           name,
            "postsCount":     random.randint(1, 5000),
            "followersCount": random.randint(0, 10000),
            "isTrending":     str(random.choice([True, False])).lower(),
            "relatedTopics":  json.dumps(random.sample(INTERESTS, k=random.randint(1, 3))),
            "createdAt":      rand_date(2019, 2024),
        })
    write_csv("hashtags.csv", rows, list(rows[0].keys()))
    return names


def gen_groups() -> None:
    rows = []
    for gid in group_ids:
        rows.append({
            "groupId":      gid,
            "name":         fake.bs().title()[:60],
            "description":  fake.catch_phrase(),
            "isPrivate":    str(random.choice([True, False])).lower(),
            "membersCount": random.randint(5, 5000),
            "categories":   json.dumps(random.sample(INTERESTS, k=random.randint(1, 3))),
            "createdAt":    rand_date(2019, 2024),
        })
    write_csv("groups.csv", rows, list(rows[0].keys()))


def gen_messages() -> None:
    rows = []
    for mid in msg_ids:
        sent = rand_date(2021, 2025)
        rows.append({
            "messageId":    mid,
            "content":      fake.sentence(),
            "isRead":       str(random.choice([True, False])).lower(),
            "mediaUrl":     random.choice([fake.image_url(), ""]),
            "reactionType": random.choice(REACTIONS + [""]),
            "sentAt":       sent,
            "readAt":       rand_later(sent) if random.random() > 0.3 else "",
        })
    write_csv("messages.csv", rows, list(rows[0].keys()))


def gen_media() -> None:
    rows = []
    for mid in media_ids:
        mtype = random.choice(MEDIA_TYPES)
        rows.append({
            "mediaId":    mid,
            "url":        fake.image_url(),
            "type":       mtype,
            "sizeKB":     round(random.uniform(10.0, 50000.0), 2),
            "format":     random.choice(FORMATS),
            "uploadedAt": rand_date(2021, 2025),
        })
    write_csv("media.csv", rows, list(rows[0].keys()))


def gen_notifications() -> None:
    rows = []
    for nid in notif_ids:
        rows.append({
            "notificationId": nid,
            "type":           random.choice(NOTIF_TYPES),
            "isRead":         str(random.choice([True, False])).lower(),
            "priority":       random.choice(PRIORITIES),
            "message":        fake.sentence(),
            "createdAt":      rand_date(2021, 2025),
        })
    write_csv("notifications.csv", rows, list(rows[0].keys()))


# ── RELATIONSHIP CSVs ────────────────────────────────────────────────────────

def gen_follows() -> list[tuple]:
    edges = []
    # backbone chain: u_0 -> u_1 -> ... -> u_N-1
    for i in range(N_USERS - 1):
        edges.append((user_ids[i], user_ids[i + 1]))
    # ~5000 random follows
    edge_set = set(edges)
    attempts = 0
    while len(edges) < N_USERS - 1 + 5000 and attempts < 200000:
        a, b = random.sample(user_ids, 2)
        if (a, b) not in edge_set:
            edge_set.add((a, b))
            edges.append((a, b))
        attempts += 1
    rows = [
        {
            "fromUserId":             a,
            "toUserId":               b,
            "since":                  rand_date(2020, 2025),
            "notificationsEnabled":   str(random.choice([True, False])).lower(),
            "mutualFriendsCount":     random.randint(0, 200),
        }
        for a, b in edges
    ]
    write_csv("follows.csv", rows, list(rows[0].keys()))
    return edges


def gen_blocked() -> None:
    edge_set = set()
    rows = []
    while len(rows) < 300:
        a, b = random.sample(user_ids, 2)
        if (a, b) not in edge_set:
            edge_set.add((a, b))
            rows.append({
                "fromUserId": a,
                "toUserId":   b,
                "blockedAt":  rand_date(2020, 2025),
                "reason":     random.choice(["spam","harassment","other"]),
                "isPermanent": str(random.choice([True, False])).lower(),
            })
    write_csv("blocked.csv", rows, list(rows[0].keys()))


def gen_posted() -> list[tuple]:
    """Every post is linked to a user. Returns (userId, postId) list."""
    edges = []
    for i, pid in enumerate(post_ids):
        uid = user_ids[i % N_USERS]
        edges.append((uid, pid))
    rows = [
        {
            "userId":   u,
            "postId":   p,
            "postedAt": rand_date(2021, 2025),
            "device":   random.choice(DEVICES),
            "location": fake.city(),
        }
        for u, p in edges
    ]
    write_csv("posted.csv", rows, list(rows[0].keys()))
    return edges


def gen_liked() -> None:
    edge_set = set()
    rows = []
    while len(rows) < 4000:
        uid = random.choice(user_ids)
        pid = random.choice(post_ids)
        if (uid, pid) not in edge_set:
            edge_set.add((uid, pid))
            rows.append({
                "userId":       uid,
                "postId":       pid,
                "likedAt":      rand_date(2021, 2025),
                "reactionType": random.choice(REACTIONS),
                "isActive":     str(random.choice([True, False])).lower(),
            })
    write_csv("liked.csv", rows, list(rows[0].keys()))


def gen_commented() -> list[tuple]:
    """Every comment is linked to a user. Returns (userId, commentId) list."""
    edges = []
    for i, cid in enumerate(comment_ids):
        uid = user_ids[i % N_USERS]
        edges.append((uid, cid))
    rows = [
        {
            "userId":          u,
            "commentId":       c,
            "commentedAt":     rand_date(2021, 2025),
            "isFirstComment":  str(random.choice([True, False])).lower(),
            "device":          random.choice(DEVICES),
        }
        for u, c in edges
    ]
    write_csv("commented.csv", rows, list(rows[0].keys()))
    return edges


def gen_contains() -> list[tuple]:
    """Every comment is inside a post. Returns (postId, commentId) list."""
    edges = []
    for i, cid in enumerate(comment_ids):
        pid = post_ids[i % N_POSTS]
        edges.append((pid, cid))
    rows = [
        {
            "postId":            p,
            "commentId":         c,
            "addedAt":           rand_date(2021, 2025),
            "isVisible":         str(random.choice([True, False])).lower(),
            "moderationStatus":  random.choice(MOD_STATUS),
        }
        for p, c in edges
    ]
    write_csv("contains.csv", rows, list(rows[0].keys()))
    return edges


def gen_replied_to() -> None:
    edge_set = set()
    rows = []
    while len(rows) < 600:
        a, b = random.sample(comment_ids, 2)
        if (a, b) not in edge_set:
            edge_set.add((a, b))
            rows.append({
                "fromCommentId":    a,
                "toCommentId":      b,
                "repliedAt":        rand_date(2021, 2025),
                "isDirectMention":  str(random.choice([True, False])).lower(),
                "notifiedParent":   str(random.choice([True, False])).lower(),
            })
    write_csv("replied_to.csv", rows, list(rows[0].keys()))


def gen_tagged_with(hashtag_names: list[str]) -> list[tuple]:
    """Every hashtag gets at least 1 post. Returns (postId, hashtagName) list."""
    edges = []
    edge_set = set()
    # guarantee every hashtag has at least one post
    shuffled_posts = post_ids[:]
    random.shuffle(shuffled_posts)
    for i, hname in enumerate(hashtag_names):
        pid = shuffled_posts[i % N_POSTS]
        if (pid, hname) not in edge_set:
            edge_set.add((pid, hname))
            edges.append((pid, hname))
    # extra random tags
    while len(edges) < N_HASHTAGS + 1500:
        pid   = random.choice(post_ids)
        hname = random.choice(hashtag_names)
        if (pid, hname) not in edge_set:
            edge_set.add((pid, hname))
            edges.append((pid, hname))
    rows = [
        {
            "postId":         p,
            "hashtagName":    h,
            "taggedAt":       rand_date(2021, 2025),
            "relevanceScore": round(random.uniform(0.0, 1.0), 4),
            "isPrimary":      str(random.choice([True, False])).lower(),
        }
        for p, h in edges
    ]
    write_csv("tagged_with.csv", rows, list(rows[0].keys()))
    return edges


def gen_member_of() -> list[tuple]:
    """Every group gets at least 5 members. Returns (userId, groupId) list."""
    edges = []
    edge_set = set()
    # guarantee >= 5 per group
    for gid in group_ids:
        members = random.sample(user_ids, 5)
        for uid in members:
            if (uid, gid) not in edge_set:
                edge_set.add((uid, gid))
                edges.append((uid, gid))
    # extra memberships
    while len(edges) < N_GROUPS * 5 + 800:
        uid = random.choice(user_ids)
        gid = random.choice(group_ids)
        if (uid, gid) not in edge_set:
            edge_set.add((uid, gid))
            edges.append((uid, gid))
    rows = [
        {
            "userId":            u,
            "groupId":           g,
            "joinedAt":          rand_date(2019, 2025),
            "role":              random.choice(ROLES),
            "contributionScore": round(random.uniform(0.0, 100.0), 2),
        }
        for u, g in edges
    ]
    write_csv("member_of.csv", rows, list(rows[0].keys()))
    return edges


def gen_sent() -> list[tuple]:
    """Every message is sent by a user. Returns (userId, messageId) list."""
    edges = []
    for i, mid in enumerate(msg_ids):
        uid = user_ids[i % N_USERS]
        edges.append((uid, mid))
    rows = [
        {
            "userId":      u,
            "messageId":   m,
            "sentAt":      rand_date(2021, 2025),
            "isEncrypted": str(random.choice([True, False])).lower(),
            "channel":     random.choice(CHANNELS),
        }
        for u, m in edges
    ]
    write_csv("sent.csv", rows, list(rows[0].keys()))
    return edges


def gen_has_media_post() -> list[tuple]:
    """Every media item is linked to a post or message. First 200 go to posts."""
    post_media = media_ids[:200]
    edges = [(random.choice(post_ids), mid) for mid in post_media]
    rows = [
        {
            "postId":     p,
            "mediaId":    m,
            "attachedAt": rand_date(2021, 2025),
            "isPrimary":  str(random.choice([True, False])).lower(),
            "caption":    fake.sentence()[:80],
        }
        for p, m in edges
    ]
    write_csv("has_media_post.csv", rows, list(rows[0].keys()))
    return edges


def gen_has_media_msg() -> list[tuple]:
    """Remaining 100 media items go to messages."""
    msg_media = media_ids[200:]
    edges = [(random.choice(msg_ids), mid) for mid in msg_media]
    rows = [
        {
            "messageId":  msg,
            "mediaId":    m,
            "attachedAt": rand_date(2021, 2025),
            "isPrimary":  str(random.choice([True, False])).lower(),
            "caption":    fake.sentence()[:80],
        }
        for msg, m in edges
    ]
    write_csv("has_media_msg.csv", rows, list(rows[0].keys()))
    return edges


def gen_received() -> list[tuple]:
    """Every notification is received by a user."""
    edges = []
    for i, nid in enumerate(notif_ids):
        uid = user_ids[i % N_USERS]
        edges.append((uid, nid))
    rows = [
        {
            "userId":           u,
            "notificationId":   n,
            "receivedAt":       rand_date(2021, 2025),
            "isRead":           str(random.choice([True, False])).lower(),
            "notificationType": random.choice(NOTIF_TYPES),
        }
        for u, n in edges
    ]
    write_csv("received.csv", rows, list(rows[0].keys()))
    return edges


def gen_about() -> list[tuple]:
    """Each notification is ABOUT a Post or Comment (combined CSV)."""
    edges = []
    for i, nid in enumerate(notif_ids):
        if i % 2 == 0:
            target = random.choice(post_ids)
            ttype  = "Post"
        else:
            target = random.choice(comment_ids)
            ttype  = "Comment"
        edges.append((nid, target, ttype))
    rows = [
        {
            "notificationId": nid,
            "targetId":       tid,
            "targetType":     tt,
            "linkedAt":       rand_date(2021, 2025),
            "context":        fake.sentence()[:80],
        }
        for nid, tid, tt in edges
    ]
    write_csv("about.csv", rows, list(rows[0].keys()))
    return edges


def gen_saved() -> None:
    edge_set = set()
    rows = []
    while len(rows) < 800:
        uid = random.choice(user_ids)
        pid = random.choice(post_ids)
        if (uid, pid) not in edge_set:
            edge_set.add((uid, pid))
            rows.append({
                "userId":    uid,
                "postId":    pid,
                "savedAt":   rand_date(2021, 2025),
                "note":      fake.sentence()[:60],
                "isPrivate": str(random.choice([True, False])).lower(),
            })
    write_csv("saved.csv", rows, list(rows[0].keys()))


def gen_shared_in() -> None:
    edge_set = set()
    rows = []
    while len(rows) < 500:
        pid = random.choice(post_ids)
        gid = random.choice(group_ids)
        if (pid, gid) not in edge_set:
            edge_set.add((pid, gid))
            rows.append({
                "postId":           pid,
                "groupId":          gid,
                "sharedAt":         rand_date(2021, 2025),
                "caption":          fake.sentence()[:80],
                "visibleToMembers": str(random.choice([True, False])).lower(),
            })
    write_csv("shared_in.csv", rows, list(rows[0].keys()))


# ── CONNECTIVITY CHECK ───────────────────────────────────────────────────────

def check_connectivity(
    follows_edges,
    posted_edges,
    commented_edges,
    contains_edges,
    tagged_edges,
    member_edges,
    sent_edges,
    has_media_post_edges,
    has_media_msg_edges,
    received_edges,
    about_edges,
) -> bool:
    G = nx.Graph()

    # add all node IDs
    G.add_nodes_from(user_ids)
    G.add_nodes_from(post_ids)
    G.add_nodes_from(comment_ids)
    G.add_nodes_from(group_ids)
    G.add_nodes_from(msg_ids)
    G.add_nodes_from(media_ids)
    G.add_nodes_from(notif_ids)
    # hashtags added when we encounter tagged_with edges

    G.add_edges_from(follows_edges)
    G.add_edges_from(posted_edges)
    G.add_edges_from(commented_edges)
    G.add_edges_from(contains_edges)
    G.add_edges_from([(p, h) for p, h in tagged_edges])
    G.add_edges_from(member_edges)
    G.add_edges_from(sent_edges)
    G.add_edges_from(has_media_post_edges)
    G.add_edges_from(has_media_msg_edges)
    G.add_edges_from(received_edges)
    G.add_edges_from([(nid, tid) for nid, tid, _ in about_edges])

    if not nx.is_connected(G):
        components = nx.number_connected_components(G)
        print(f"  WARNING: graph has {components} components, adding bridges...")
        comps = list(nx.connected_components(G))
        for i in range(len(comps) - 1):
            node_a = next(iter(comps[i] & set(user_ids)) or iter(comps[i]))
            node_b = next(iter(comps[i + 1] & set(user_ids)) or iter(comps[i + 1]))
            G.add_edge(node_a, node_b)
            follows_edges.append((node_a, node_b))
        return nx.is_connected(G)
    return True


# ── MAIN ─────────────────────────────────────────────────────────────────────

def main() -> None:
    t0 = time.time()
    print("Generating node CSVs...")
    gen_users()
    gen_posts()
    gen_comments()
    hashtag_names = gen_hashtags()
    gen_groups()
    gen_messages()
    gen_media()
    gen_notifications()

    print("\nGenerating relationship CSVs...")
    follows_edges        = gen_follows()
    gen_blocked()
    posted_edges         = gen_posted()
    gen_liked()
    commented_edges      = gen_commented()
    contains_edges       = gen_contains()
    gen_replied_to()
    tagged_edges         = gen_tagged_with(hashtag_names)
    member_edges         = gen_member_of()
    sent_edges           = gen_sent()
    has_media_post_edges = gen_has_media_post()
    has_media_msg_edges  = gen_has_media_msg()
    received_edges       = gen_received()
    about_edges          = gen_about()
    gen_saved()
    gen_shared_in()

    total_nodes = (
        N_USERS + N_POSTS + N_COMMENTS + N_HASHTAGS +
        N_GROUPS + N_MESSAGES + N_MEDIA + N_NOTIFICATIONS
    )
    elapsed = round(time.time() - t0, 1)

    print("\nValidating connectivity...")
    connected = check_connectivity(
        follows_edges, posted_edges, commented_edges, contains_edges,
        tagged_edges, member_edges, sent_edges,
        has_media_post_edges, has_media_msg_edges,
        received_edges, about_edges,
    )

    print(f"\n{'='*50}")
    print(f"Total nodes generated : {total_nodes}")
    print(f"  User={N_USERS}, Post={N_POSTS}, Comment={N_COMMENTS}, Hashtag={N_HASHTAGS}")
    print(f"  Group={N_GROUPS}, Message={N_MESSAGES}, Media={N_MEDIA}, Notification={N_NOTIFICATIONS}")
    print(f"CSVs written to       : {DATA_DIR}")
    print(f"Elapsed               : {elapsed}s")
    print(f"is_connected          = {connected}")
    print('='*50)


if __name__ == "__main__":
    main()
