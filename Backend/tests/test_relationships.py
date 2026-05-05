from services import rel_service


def test_create_relationship(client, monkeypatch):
    monkeypatch.setattr(
        rel_service,
        "create_relationship",
        lambda from_label, from_id, to_label, to_id, rel_type, properties: {
            "from": from_id,
            "to": to_id,
            "type": rel_type,
            "properties": properties,
        },
    )

    response = client.post(
        "/api/relationships",
        json={
            "from_label": "User",
            "from_id": "u_1",
            "to_label": "User",
            "to_id": "u_2",
            "type": "FOLLOWS",
            "properties": {"since": "2026-05-01", "notificationsEnabled": True, "mutualFriendsCount": 1},
        },
    )

    assert response.status_code == 201
    assert response.json["data"]["type"] == "FOLLOWS"


def test_get_relationships(client, monkeypatch):
    monkeypatch.setattr(
        rel_service,
        "get_relationships",
        lambda rel_type, skip, limit, filters=None: [{"type": rel_type, "filters": filters}],
    )

    response = client.get("/api/relationships?type=LIKED&reactionType=like")

    assert response.status_code == 200
    assert response.json["data"][0]["filters"] == {"reactionType": "like"}


def test_update_relationship_properties(client, monkeypatch):
    monkeypatch.setattr(rel_service, "update_rel_props", lambda rel_id, properties: {"relId": rel_id, **properties})

    response = client.patch("/api/relationships/r_1/properties", json={"properties": {"reactionType": "love"}})

    assert response.status_code == 200
    assert response.json["data"]["reactionType"] == "love"


def test_bulk_update_relationship_properties(client, monkeypatch):
    monkeypatch.setattr(rel_service, "bulk_update_rel_props", lambda items: items)

    response = client.patch(
        "/api/relationships/properties/bulk",
        json={"items": [{"rel_id": "r_1", "properties": {"reactionType": "love"}}]},
    )

    assert response.status_code == 200
    assert response.json["data"][0]["rel_id"] == "r_1"


def test_delete_relationship_properties(client, monkeypatch):
    monkeypatch.setattr(rel_service, "delete_rel_props", lambda rel_id, keys: {"relId": rel_id, "removed": keys})

    response = client.delete("/api/relationships/r_1/properties", json={"keys": ["reactionType"]})

    assert response.status_code == 200
    assert response.json["data"]["removed"] == ["reactionType"]


def test_bulk_delete_relationship_properties(client, monkeypatch):
    monkeypatch.setattr(rel_service, "bulk_delete_rel_props", lambda items: items)

    response = client.delete(
        "/api/relationships/properties/bulk",
        json={"items": [{"rel_id": "r_1", "keys": ["reactionType"]}]},
    )

    assert response.status_code == 200
    assert response.json["data"][0]["keys"] == ["reactionType"]


def test_delete_one_relationship(client, monkeypatch):
    monkeypatch.setattr(rel_service, "delete_relationship", lambda rel_id: None)

    response = client.delete("/api/relationships/r_1")

    assert response.status_code == 200
    assert response.json["data"] == {"deleted": "r_1"}


def test_delete_many_relationships(client, monkeypatch):
    monkeypatch.setattr(rel_service, "delete_relationships", lambda rel_type, filters=None: 4)

    response = client.delete("/api/relationships", json={"type": "LIKED", "filters": {"reactionType": "like"}})

    assert response.status_code == 200
    assert response.json["data"] == {"deleted": 4}
