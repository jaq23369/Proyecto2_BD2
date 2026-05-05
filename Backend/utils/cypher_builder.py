import json
from datetime import date, datetime

from db.schema import (
    LABELS,
    RELATIONSHIP_TYPES,
    LABEL_PROPERTIES,
    RELATIONSHIP_PROPERTIES,
    NODE_PROPERTY_TYPES,
    RELATIONSHIP_PROPERTY_TYPES,
)
from utils.errors import InvalidLabelError, ValidationFailed


def validate_label(label: str) -> str:
    if label not in LABELS:
        raise InvalidLabelError(label)
    return label


def validate_rel_type(rel_type: str) -> str:
    if rel_type not in RELATIONSHIP_TYPES:
        raise InvalidLabelError(rel_type)
    return rel_type


def validate_node_props(label: str, props: dict) -> dict:
    allowed = LABEL_PROPERTIES.get(label, set())
    invalid = set(props.keys()) - allowed
    if invalid:
        raise InvalidLabelError(f"Properties not allowed on {label}: {invalid}")
    return props


def validate_node_props_for_labels(labels: list[str], props: dict) -> dict:
    allowed = set()
    for label in labels:
        validate_label(label)
        allowed |= LABEL_PROPERTIES.get(label, set())
    invalid = set(props.keys()) - allowed
    if invalid:
        raise InvalidLabelError(f"Properties not allowed on {labels}: {invalid}")
    return props


def validate_rel_props(rel_type: str, props: dict) -> dict:
    allowed = RELATIONSHIP_PROPERTIES.get(rel_type, set())
    invalid = set(props.keys()) - allowed
    if invalid:
        raise InvalidLabelError(f"Properties not allowed on {rel_type}: {invalid}")
    return props


def coerce_node_props(label: str, props: dict) -> dict:
    return _coerce_props(props, NODE_PROPERTY_TYPES.get(label, {}))


def coerce_rel_props(rel_type: str, props: dict) -> dict:
    return _coerce_props(props, RELATIONSHIP_PROPERTY_TYPES.get(rel_type, {}))


def coerce_node_props_for_labels(labels: list[str], props: dict) -> dict:
    type_map = {}
    for label in labels:
        type_map.update(NODE_PROPERTY_TYPES.get(label, {}))
    return _coerce_props(props, type_map)


def _coerce_props(props: dict, type_map: dict[str, str]) -> dict:
    coerced = {}
    for key, value in props.items():
        coerced[key] = _coerce_value(value, type_map.get(key))
    return coerced


def _coerce_value(value, expected_type: str | None):
    if value is None or value == "":
        return None
    if expected_type == "boolean":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"true", "1", "yes", "y", "si", "sí"}
        return bool(value)
    if expected_type == "integer":
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationFailed(f"Invalid integer value '{value}'") from exc
    if expected_type == "float":
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise ValidationFailed(f"Invalid float value '{value}'") from exc
    if expected_type == "list":
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else [parsed]
            except json.JSONDecodeError:
                return [item.strip() for item in value.split(",") if item.strip()]
        return [value]
    if expected_type == "date":
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return date.fromisoformat(value[:10])
            except ValueError as exc:
                raise ValidationFailed(f"Invalid date value '{value}'. Use YYYY-MM-DD") from exc
    return value


def build_set_clause(props: dict, alias: str = "n") -> tuple[str, dict]:
    """Return (SET clause string, params dict) for the given props."""
    if not props:
        return "", {}
    parts = [f"{alias}.{k} = $prop_{k}" for k in props]
    params = {f"prop_{k}": v for k, v in props.items()}
    return "SET " + ", ".join(parts), params


def build_remove_clause(keys: list[str], alias: str = "n") -> str:
    """Return REMOVE clause string for the given property keys."""
    if not keys:
        return ""
    parts = [f"{alias}.{k}" for k in keys]
    return "REMOVE " + ", ".join(parts)


def build_labels_str(labels: list[str]) -> str:
    """Return ':Label1:Label2' string after validating each label."""
    for lbl in labels:
        validate_label(lbl)
    return ":" + ":".join(labels)
