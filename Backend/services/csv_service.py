import pandas as pd
from db.neo4j_client import run_write
from db.schema import ID_PROPERTY
from utils.cypher_builder import validate_label, validate_rel_type
from utils.errors import ValidationFailed

CHUNK_SIZE = 1000


def _to_dicts(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame rows to dicts, replacing NaN/NaT with None."""
    records = []
    for row in df.to_dict(orient="records"):
        records.append({k: (None if pd.isna(v) else v) for k, v in row.items()})
    return records


def load_nodes(df: pd.DataFrame, label: str) -> int:
    validate_label(label)
    id_prop = ID_PROPERTY[label]
    rows = _to_dicts(df)
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), CHUNK_SIZE):
        chunk = rows[i : i + CHUNK_SIZE]
        cypher = (
            f"UNWIND $rows AS row "
            f"MERGE (n:{label} {{{id_prop}: row.{id_prop}}}) "
            f"SET n += row"
        )
        run_write(cypher, {"rows": chunk})
        total += len(chunk)
    return total


def load_relationships(
    df: pd.DataFrame,
    rel_type: str,
    from_label: str,
    to_label: str,
    from_id_col: str,
    to_id_col: str,
) -> int:
    validate_rel_type(rel_type)
    validate_label(from_label)
    validate_label(to_label)
    from_id_prop = ID_PROPERTY[from_label]
    to_id_prop = ID_PROPERTY[to_label]

    prop_cols = [c for c in df.columns if c not in (from_id_col, to_id_col)]
    rows = _to_dicts(df)
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), CHUNK_SIZE):
        chunk = rows[i : i + CHUNK_SIZE]
        # Build a props-only sub-map inside Cypher to avoid storing id cols on the rel
        prop_map = "{" + ", ".join(f"{c}: row.{c}" for c in prop_cols) + "}" if prop_cols else "{}"
        cypher = (
            f"UNWIND $rows AS row "
            f"MATCH (a:{from_label} {{{from_id_prop}: row.{from_id_col}}}) "
            f"MATCH (b:{to_label} {{{to_id_prop}: row.{to_id_col}}}) "
            f"MERGE (a)-[r:{rel_type}]->(b) "
            f"SET r += {prop_map}"
        )
        run_write(cypher, {"rows": chunk})
        total += len(chunk)
    return total


def load_about_relationships(df: pd.DataFrame) -> int:
    """Special loader for about.csv: target can be Post or Comment."""
    total = 0
    for target_type, group in df.groupby("targetType"):
        if target_type == "Post":
            to_label, to_id_prop, to_id_col = "Post", "postId", "targetId"
        elif target_type == "Comment":
            to_label, to_id_prop, to_id_col = "Comment", "commentId", "targetId"
        else:
            continue
        prop_cols = [c for c in group.columns if c not in ("notificationId", "targetId", "targetType")]
        rows = _to_dicts(group)
        for i in range(0, len(rows), CHUNK_SIZE):
            chunk = rows[i : i + CHUNK_SIZE]
            prop_map = "{" + ", ".join(f"{c}: row.{c}" for c in prop_cols) + ", targetType: row.targetType}"
            cypher = (
                f"UNWIND $rows AS row "
                f"MATCH (notif:Notification {{notificationId: row.notificationId}}) "
                f"MATCH (target:{to_label} {{{to_id_prop}: row.targetId}}) "
                f"MERGE (notif)-[r:ABOUT]->(target) "
                f"SET r += {prop_map}"
            )
            run_write(cypher, {"rows": chunk})
            total += len(chunk)
    return total
