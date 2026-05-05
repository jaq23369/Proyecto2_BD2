from services import gds_service


def test_pagerank_endpoint(client, monkeypatch):
    monkeypatch.setattr(gds_service, "run_pagerank", lambda top_n=20: {"results": [{"username": "nery", "score": 1.0}]})

    response = client.post("/api/gds/pagerank", json={"topN": 5})

    assert response.status_code == 200
    assert response.json["data"]["results"][0]["score"] == 1.0


def test_node_similarity_endpoint(client, monkeypatch):
    monkeypatch.setattr(
        gds_service,
        "run_node_similarity",
        lambda user_id, top_k=10: {"userId": user_id, "results": [{"username": "similar", "similarity": 0.8}]},
    )

    response = client.post("/api/gds/node-similarity", json={"userId": "u_1", "topK": 3})

    assert response.status_code == 200
    assert response.json["data"]["userId"] == "u_1"


def test_communities_endpoint(client, monkeypatch):
    monkeypatch.setattr(gds_service, "run_louvain", lambda top_n=20: {"results": [{"communityId": 1, "size": 12}]})

    response = client.post("/api/gds/communities", json={"topN": 2})

    assert response.status_code == 200
    assert response.json["data"]["results"][0]["communityId"] == 1


def test_drop_graph_endpoint(client, monkeypatch):
    monkeypatch.setattr(gds_service, "drop_graph", lambda graph_name: {"graphName": graph_name, "dropped": True})

    response = client.delete("/api/gds/graph/social_follows_pagerank")

    assert response.status_code == 200
    assert response.json["data"]["dropped"] is True
