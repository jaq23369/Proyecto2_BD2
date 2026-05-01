from db.neo4j_client import run_read, run_write
from db.schema import ID_PROPERTY
from utils.cypher_builder import (
    validate_label, validate_node_props,
    build_labels_str, build_remove_clause,
)
from utils.errors import NotFoundError, Neo4jServiceError


def _id_prop(label: str) -> str:
    return ID_PROPERTY[label]


def create_node(labels: list[str], properties: dict) -> dict:
    labels_str = build_labels_str(labels)
    if properties:
        validate_node_props(labels[0], properties)
    cypher = f"CREATE (n{labels_str} $props) RETURN n"
    rows = run_write(cypher, {"props": properties})
    if not rows:
        raise Neo4jServiceError("Failed to create node")
    return rows[0]["n"]


def get_node(label: str, node_id: str) -> dict:
    validate_label(label)
    id_prop = _id_prop(label)
    cypher = f"MATCH (n:{label} {{{id_prop}: $id}}) RETURN n"
    rows = run_read(cypher, {"id": node_id})
    if not rows:
        raise NotFoundError(f"{label} '{node_id}' not found")
    return rows[0]["n"]


def get_nodes(label: str, skip: int = 0, limit: int = 20, filters: dict | None = None) -> list[dict]:
    validate_label(label)
    params: dict = {"skip": skip, "limit": limit}
    where_parts = []
    if filters:
        for k, v in filters.items():
            params[f"f_{k}"] = v
            where_parts.append(f"n.{k} = $f_{k}")
    where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
    cypher = f"MATCH (n:{label}) {where} RETURN n SKIP $skip LIMIT $limit"
    return [r["n"] for r in run_read(cypher, params)]


def aggregate_nodes(label: str, group_by: str) -> list[dict]:
    validate_label(label)
    cypher = (
        f"MATCH (n:{label}) "
        f"RETURN n.{group_by} AS value, count(*) AS count "
        f"ORDER BY count DESC"
    )
    return run_read(cypher)


def update_node_props(label: str, node_id: str, properties: dict) -> dict:
    validate_label(label)
    validate_node_props(label, properties)
    id_prop = _id_prop(label)
    cypher = f"MATCH (n:{label} {{{id_prop}: $id}}) SET n += $props RETURN n"
    rows = run_write(cypher, {"id": node_id, "props": properties})
    if not rows:
        raise NotFoundError(f"{label} '{node_id}' not found")
    return rows[0]["n"]


def bulk_update_node_props(items: list[dict]) -> list[dict]:
    results = []
    for item in items:
        label = item["label"]
        validate_label(label)
        validate_node_props(label, item["properties"])
        id_prop = _id_prop(label)
        cypher = f"MATCH (n:{label} {{{id_prop}: $id}}) SET n += $props RETURN n"
        rows = run_write(cypher, {"id": item["id"], "props": item["properties"]})
        if rows:
            results.append(rows[0]["n"])
    return results


def delete_node_props(label: str, node_id: str, keys: list[str]) -> dict:
    validate_label(label)
    id_prop = _id_prop(label)
    remove_clause = build_remove_clause(keys)
    cypher = f"MATCH (n:{label} {{{id_prop}: $id}}) {remove_clause} RETURN n"
    rows = run_write(cypher, {"id": node_id})
    if not rows:
        raise NotFoundError(f"{label} '{node_id}' not found")
    return rows[0]["n"]


def bulk_delete_node_props(items: list[dict]) -> list[dict]:
    results = []
    for item in items:
        label = item["label"]
        validate_label(label)
        id_prop = _id_prop(label)
        remove_clause = build_remove_clause(item["keys"])
        cypher = f"MATCH (n:{label} {{{id_prop}: $id}}) {remove_clause} RETURN n"
        rows = run_write(cypher, {"id": item["id"]})
        if rows:
            results.append(rows[0]["n"])
    return results


def delete_node(label: str, node_id: str, detach: bool = True) -> None:
    validate_label(label)
    id_prop = _id_prop(label)
    keyword = "DETACH DELETE" if detach else "DELETE"
    cypher = f"MATCH (n:{label} {{{id_prop}: $id}}) {keyword} n"
    run_write(cypher, {"id": node_id})


def delete_nodes(label: str, ids: list[str]) -> int:
    validate_label(label)
    id_prop = _id_prop(label)
    cypher = f"MATCH (n:{label}) WHERE n.{id_prop} IN $ids DETACH DELETE n"
    run_write(cypher, {"ids": ids})
    return len(ids)
