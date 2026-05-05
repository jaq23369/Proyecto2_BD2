from datetime import date

import pytest
from pydantic import ValidationError

from db.schema import LABEL_PROPERTIES, RELATIONSHIP_PROPERTIES
from schemas.rel_schemas import CreateRelPayload
from services import csv_service
from utils.cypher_builder import coerce_node_props, coerce_rel_props


def test_schema_has_minimum_labels_and_properties():
    assert len(LABEL_PROPERTIES) >= 5
    assert all(len(props) >= 5 for props in LABEL_PROPERTIES.values())


def test_schema_has_minimum_relationship_types_and_properties():
    assert len(RELATIONSHIP_PROPERTIES) >= 10
    assert all(len(props) >= 3 for props in RELATIONSHIP_PROPERTIES.values())


def test_property_type_coercion_covers_required_neo4j_types():
    user_props = coerce_node_props(
        "User",
        {
            "username": "nery",
            "followersCount": "10",
            "isVerified": "true",
            "interests": '["neo4j", "graphs"]',
            "birthDate": "2000-01-01",
        },
    )
    media_props = coerce_node_props("Media", {"sizeKB": "12.5"})
    rel_props = coerce_rel_props("FOLLOWS", {"since": "2026-05-05"})

    assert isinstance(user_props["username"], str)
    assert isinstance(user_props["followersCount"], int)
    assert isinstance(media_props["sizeKB"], float)
    assert isinstance(user_props["isVerified"], bool)
    assert isinstance(user_props["interests"], list)
    assert isinstance(user_props["birthDate"], date)
    assert isinstance(rel_props["since"], date)


def test_relationship_creation_requires_three_properties():
    with pytest.raises(ValidationError):
        CreateRelPayload(
            from_label="User",
            from_id="u_1",
            to_label="User",
            to_id="u_2",
            type="FOLLOWS",
            properties={"since": "2026-05-05"},
        )


def test_csv_node_loader_coerces_types_before_writing(monkeypatch):
    pd = pytest.importorskip("pandas")
    captured = {}
    df = pd.DataFrame([
        {
            "userId": "u_demo",
            "username": "nery",
            "email": "nery@example.com",
            "bio": "demo",
            "profilePicUrl": "",
            "isVerified": "true",
            "followersCount": "1",
            "followingCount": "2",
            "interests": '["neo4j"]',
            "birthDate": "2000-01-01",
            "createdAt": "2026-05-05",
        }
    ])

    monkeypatch.setattr(csv_service, "run_write", lambda _cypher, params=None: captured.update(params or {}))

    assert csv_service.load_nodes(df, "User") == 1
    row = captured["rows"][0]
    assert isinstance(row["isVerified"], bool)
    assert isinstance(row["followersCount"], int)
    assert isinstance(row["interests"], list)
    assert isinstance(row["birthDate"], date)


def test_csv_relationship_loader_coerces_types_before_writing(monkeypatch):
    pd = pytest.importorskip("pandas")
    captured = {}
    df = pd.DataFrame([
        {
            "fromUserId": "u_1",
            "toUserId": "u_2",
            "since": "2026-05-05",
            "notificationsEnabled": "false",
            "mutualFriendsCount": "3",
        }
    ])

    monkeypatch.setattr(csv_service, "run_write", lambda _cypher, params=None: captured.update(params or {}))

    assert csv_service.load_relationships(df, "FOLLOWS", "User", "User", "fromUserId", "toUserId") == 1
    row = captured["rows"][0]
    assert isinstance(row["since"], date)
    assert isinstance(row["notificationsEnabled"], bool)
    assert isinstance(row["mutualFriendsCount"], int)
