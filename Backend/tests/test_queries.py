import pytest

from api import queries


@pytest.mark.parametrize(
    "path",
    [
        "/api/queries/top-influencers",
        "/api/queries/trending-hashtags",
        "/api/queries/most-liked-posts",
        "/api/queries/largest-groups",
        "/api/queries/negative-comments",
        "/api/queries/most-active-users",
    ],
)
def test_demo_queries_return_data(client, monkeypatch, path):
    monkeypatch.setattr(queries, "run_read", lambda cypher, params=None: [{"sample": True, "params": params or {}}])

    response = client.get(path)

    assert response.status_code == 200
    assert response.json["ok"] is True
    assert response.json["data"] == [{"sample": True, "params": {"limit": 10}}] or response.json["data"][0]["sample"] is True


def test_trending_hashtags_accepts_days_param(client, monkeypatch):
    captured = {}

    def fake_run_read(_cypher, params=None):
        captured.update(params or {})
        return [{"hashtag": "neo4j", "uses": 3}]

    monkeypatch.setattr(queries, "run_read", fake_run_read)

    response = client.get("/api/queries/trending-hashtags?days=90&limit=5")

    assert response.status_code == 200
    assert captured["days"] == 90
    assert captured["limit"] == 5
