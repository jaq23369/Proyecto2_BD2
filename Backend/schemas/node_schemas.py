from pydantic import BaseModel, field_validator
from db.schema import LABELS


class CreateNodePayload(BaseModel):
    labels: list[str]
    properties: dict = {}

    @field_validator("labels")
    @classmethod
    def labels_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("labels must contain at least one element")
        for lbl in v:
            if lbl not in LABELS:
                raise ValueError(f"Unknown label: '{lbl}'")
        return v


class UpdatePropsPayload(BaseModel):
    properties: dict

    @field_validator("properties")
    @classmethod
    def props_not_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("properties must not be empty")
        return v


class RemovePropsPayload(BaseModel):
    keys: list[str]

    @field_validator("keys")
    @classmethod
    def keys_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("keys must not be empty")
        return v


class BulkUpdateItem(BaseModel):
    id: str
    label: str
    properties: dict


class BulkUpdatePayload(BaseModel):
    items: list[BulkUpdateItem]


class BulkRemoveItem(BaseModel):
    id: str
    label: str
    keys: list[str]


class BulkRemovePayload(BaseModel):
    items: list[BulkRemoveItem]
