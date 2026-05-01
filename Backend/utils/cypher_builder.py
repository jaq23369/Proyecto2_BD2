from db.schema import LABELS, RELATIONSHIP_TYPES, LABEL_PROPERTIES, RELATIONSHIP_PROPERTIES
from utils.errors import InvalidLabelError


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


def validate_rel_props(rel_type: str, props: dict) -> dict:
    allowed = RELATIONSHIP_PROPERTIES.get(rel_type, set())
    invalid = set(props.keys()) - allowed
    if invalid:
        raise InvalidLabelError(f"Properties not allowed on {rel_type}: {invalid}")
    return props


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
