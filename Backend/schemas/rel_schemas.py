from pydantic import BaseModel, field_validator
from db.schema import LABELS, RELATIONSHIP_TYPES


class CreateRelPayload(BaseModel):
    from_label: str
    from_id: str
    to_label: str
    to_id: str
    type: str
    properties: dict = {}

    @field_validator("from_label", "to_label")
    @classmethod
    def validate_label(cls, v: str) -> str:
        if v not in LABELS:
            raise ValueError(f"Unknown label: '{v}'")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in RELATIONSHIP_TYPES:
            raise ValueError(f"Unknown relationship type: '{v}'")
        return v


class UpdateRelPropsPayload(BaseModel):
    properties: dict

    @field_validator("properties")
    @classmethod
    def props_not_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("properties must not be empty")
        return v


class RemoveRelPropsPayload(BaseModel):
    keys: list[str]

    @field_validator("keys")
    @classmethod
    def keys_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("keys must not be empty")
        return v


class BulkRelUpdateItem(BaseModel):
    rel_id: str
    properties: dict


class BulkRelUpdatePayload(BaseModel):
    items: list[BulkRelUpdateItem]


class BulkRelRemoveItem(BaseModel):
    rel_id: str
    keys: list[str]


class BulkRelRemovePayload(BaseModel):
    items: list[BulkRelRemoveItem]
