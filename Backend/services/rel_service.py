from db.neo4j_client import run_read, run_write
from db.schema import ID_PROPERTY
from utils.cypher_builder import validate_label, validate_rel_type, validate_rel_props
from utils.errors import NotFoundError, Neo4jServiceError


def _id_prop(label: str) -> str:
    return ID_PROPERTY[label]


def create_relationship(
    from_label: str, from_id: str,
    to_label: str, to_id: str,
    rel_type: str, properties: dict,
) -> dict:
    validate_label(from_label)
    validate_label(to_label)
    validate_rel_type(rel_type)
    if properties:
        validate_rel_props(rel_type, properties)
    from_id_prop = _id_prop(from_label)
    to_id_prop = _id_prop(to_label)
    cypher = (
        f"MATCH (a:{from_label} {{{from_id_prop}: $from_id}}), "
        f"(b:{to_label} {{{to_id_prop}: $to_id}}) "
        f"CREATE (a)-[r:{rel_type} $props]->(b) "
        f"RETURN elementId(r) AS relId, type(r) AS type, properties(r) AS properties, "
        f"elementId(a) AS fromElemId, elementId(b) AS toElemId"
    )
    rows = run_write(cypher, {"from_id": from_id, "to_id": to_id, "props": properties})
    if not rows:
        raise Neo4jServiceError("Failed to create relationship — check that both nodes exist")
    return rows[0]


def get_relationships(rel_type: str, skip: int = 0, limit: int = 20, filters: dict | None = None) -> list[dict]:
    validate_rel_type(rel_type)
    params: dict = {"skip": skip, "limit": limit}
    where_parts = []
    if filters:
        for k, v in filters.items():
            params[f"f_{k}"] = v
            where_parts.append(f"r.{k} = $f_{k}")
    where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
    cypher = (
        f"MATCH ()-[r:{rel_type}]->() {where} "
        f"RETURN elementId(r) AS relId, type(r) AS type, properties(r) AS properties "
        f"SKIP $skip LIMIT $limit"
    )
    return run_read(cypher, params)


def update_rel_props(rel_id: str, properties: dict) -> dict:
    cypher = (
        "MATCH ()-[r]->() WHERE elementId(r) = $rel_id "
        "SET r += $props "
        "RETURN elementId(r) AS relId, type(r) AS type, properties(r) AS properties"
    )
    rows = run_write(cypher, {"rel_id": rel_id, "props": properties})
    if not rows:
        raise NotFoundError(f"Relationship '{rel_id}' not found")
    return rows[0]


def bulk_update_rel_props(items: list[dict]) -> list[dict]:
    return [update_rel_props(item["rel_id"], item["properties"]) for item in items]


def delete_rel_props(rel_id: str, keys: list[str]) -> dict:
    remove_parts = ", ".join(f"r.{k}" for k in keys)
    cypher = (
        f"MATCH ()-[r]->() WHERE elementId(r) = $rel_id "
        f"REMOVE {remove_parts} "
        f"RETURN elementId(r) AS relId, type(r) AS type, properties(r) AS properties"
    )
    rows = run_write(cypher, {"rel_id": rel_id})
    if not rows:
        raise NotFoundError(f"Relationship '{rel_id}' not found")
    return rows[0]


def bulk_delete_rel_props(items: list[dict]) -> list[dict]:
    return [delete_rel_props(item["rel_id"], item["keys"]) for item in items]


def delete_relationship(rel_id: str) -> None:
    cypher = "MATCH ()-[r]->() WHERE elementId(r) = $rel_id DELETE r"
    run_write(cypher, {"rel_id": rel_id})


def delete_relationships(rel_type: str, filters: dict | None = None) -> int:
    validate_rel_type(rel_type)
    params: dict = {}
    where_parts = []
    if filters:
        for k, v in filters.items():
            params[f"f_{k}"] = v
            where_parts.append(f"r.{k} = $f_{k}")
    where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
    count_rows = run_read(f"MATCH ()-[r:{rel_type}]->() {where} RETURN count(r) AS cnt", params)
    count = count_rows[0]["cnt"] if count_rows else 0
    run_write(f"MATCH ()-[r:{rel_type}]->() {where} DELETE r", params)
    return count
