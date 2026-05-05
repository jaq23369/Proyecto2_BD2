from services import node_service


def test_create_node(client, monkeypatch):
    monkeypatch.setattr(node_service, "create_node", lambda labels, properties: {"labels": labels, **properties})

    response = client.post(
        "/api/nodes",
        json={"labels": ["Hashtag"], "properties": {"name": "neo4j", "postsCount": 1}},
    )

    assert response.status_code == 201
    assert response.json["ok"] is True
    assert response.json["data"]["name"] == "neo4j"


def test_get_one_node(client, monkeypatch):
    monkeypatch.setattr(node_service, "get_node", lambda label, node_id: {"label": label, "id": node_id})

    response = client.get("/api/nodes/User/u_1")

    assert response.status_code == 200
    assert response.json["data"] == {"label": "User", "id": "u_1"}


def test_get_many_nodes(client, monkeypatch):
    monkeypatch.setattr(
        node_service,
        "get_nodes",
        lambda label, skip, limit, filters=None: [{"label": label, "skip": skip, "limit": limit, "filters": filters}],
    )

    response = client.get("/api/nodes?label=Post&limit=3&isPublic=true")

    assert response.status_code == 200
    assert response.json["data"][0]["label"] == "Post"
    assert response.json["data"][0]["filters"] == {"isPublic": "true"}


def test_aggregate_nodes(client, monkeypatch):
    monkeypatch.setattr(node_service, "aggregate_nodes", lambda label, group_by: [{"value": True, "count": 7}])

    response = client.get("/api/nodes/aggregate?label=Post&groupBy=isPublic")

    assert response.status_code == 200
    assert response.json["data"][0]["count"] == 7


def test_update_node_properties(client, monkeypatch):
    monkeypatch.setattr(node_service, "update_node_props", lambda label, node_id, properties: {"id": node_id, **properties})

    response = client.patch("/api/nodes/User/u_1/properties", json={"properties": {"bio": "updated"}})

    assert response.status_code == 200
    assert response.json["data"]["bio"] == "updated"


def test_bulk_update_node_properties(client, monkeypatch):
    monkeypatch.setattr(node_service, "bulk_update_node_props", lambda items: items)

    response = client.patch(
        "/api/nodes/properties/bulk",
        json={"items": [{"id": "u_1", "label": "User", "properties": {"bio": "a"}}]},
    )

    assert response.status_code == 200
    assert response.json["data"][0]["id"] == "u_1"


def test_delete_node_properties(client, monkeypatch):
    monkeypatch.setattr(node_service, "delete_node_props", lambda label, node_id, keys: {"id": node_id, "removed": keys})

    response = client.delete("/api/nodes/User/u_1/properties", json={"keys": ["bio"]})

    assert response.status_code == 200
    assert response.json["data"]["removed"] == ["bio"]


def test_bulk_delete_node_properties(client, monkeypatch):
    monkeypatch.setattr(node_service, "bulk_delete_node_props", lambda items: items)

    response = client.delete(
        "/api/nodes/properties/bulk",
        json={"items": [{"id": "u_1", "label": "User", "keys": ["bio"]}]},
    )

    assert response.status_code == 200
    assert response.json["data"][0]["keys"] == ["bio"]


def test_delete_one_node(client, monkeypatch):
    monkeypatch.setattr(node_service, "delete_node", lambda label, node_id, detach=True: None)

    response = client.delete("/api/nodes/User/u_1?detach=true")

    assert response.status_code == 200
    assert response.json["data"] == {"deleted": "u_1"}


def test_delete_many_nodes(client, monkeypatch):
    monkeypatch.setattr(node_service, "delete_nodes", lambda label, ids: len(ids))

    response = client.delete("/api/nodes", json={"label": "User", "ids": ["u_1", "u_2"]})

    assert response.status_code == 200
    assert response.json["data"] == {"deleted": 2}
