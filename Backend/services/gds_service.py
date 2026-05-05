from db.neo4j_client import run_read, run_write


PAGERANK_GRAPH = "social_follows_pagerank"
SIMILARITY_GRAPH = "social_user_post_similarity"
COMMUNITY_GRAPH = "social_follows_communities"


def _drop_graph(graph_name: str) -> None:
    try:
        run_write(
            "CALL gds.graph.drop($graph_name, false) YIELD graphName RETURN graphName",
            {"graph_name": graph_name},
        )
    except Exception:
        # The graph may not exist yet; projection below is the real requirement.
        pass


def _project_follows_graph(graph_name: str, orientation: str = "NATURAL") -> dict:
    _drop_graph(graph_name)
    rows = run_write(
        "CALL gds.graph.project("
        "$graph_name, "
        "'User', "
        "{FOLLOWS: {type: 'FOLLOWS', orientation: $orientation}}"
        ") "
        "YIELD graphName, nodeCount, relationshipCount "
        "RETURN graphName, nodeCount, relationshipCount",
        {"graph_name": graph_name, "orientation": orientation},
    )
    return rows[0] if rows else {"graphName": graph_name, "nodeCount": 0, "relationshipCount": 0}


def _project_similarity_graph(graph_name: str) -> dict:
    _drop_graph(graph_name)
    rows = run_write(
        "CALL gds.graph.project("
        "$graph_name, "
        "['User', 'Post'], "
        "{LIKED: {type: 'LIKED', orientation: 'UNDIRECTED'}}"
        ") "
        "YIELD graphName, nodeCount, relationshipCount "
        "RETURN graphName, nodeCount, relationshipCount",
        {"graph_name": graph_name},
    )
    return rows[0] if rows else {"graphName": graph_name, "nodeCount": 0, "relationshipCount": 0}


def run_pagerank(top_n: int = 20) -> dict:
    projection = _project_follows_graph(PAGERANK_GRAPH)
    rows = run_read(
        "CALL gds.pageRank.stream($graph_name) "
        "YIELD nodeId, score "
        "MATCH (u:User) WHERE id(u) = nodeId "
        "RETURN u.userId AS userId, u.username AS username, score "
        "ORDER BY score DESC "
        "LIMIT $top_n",
        {"graph_name": PAGERANK_GRAPH, "top_n": top_n},
    )
    return {"projection": projection, "results": rows}


def run_node_similarity(user_id: str, top_k: int = 10) -> dict:
    projection = _project_similarity_graph(SIMILARITY_GRAPH)
    rows = run_read(
        "MATCH (source:User {userId: $user_id}) "
        "WITH id(source) AS sourceId "
        "CALL gds.nodeSimilarity.stream($graph_name, {topK: $top_k}) "
        "YIELD node1, node2, similarity "
        "WITH sourceId, "
        "CASE "
        "  WHEN node1 = sourceId THEN node2 "
        "  WHEN node2 = sourceId THEN node1 "
        "  ELSE null "
        "END AS otherNodeId, similarity "
        "WHERE otherNodeId IS NOT NULL "
        "MATCH (u:User) WHERE id(u) = otherNodeId "
        "RETURN u.userId AS userId, u.username AS username, similarity "
        "ORDER BY similarity DESC "
        "LIMIT $top_k",
        {"graph_name": SIMILARITY_GRAPH, "user_id": user_id, "top_k": top_k},
    )
    return {"projection": projection, "userId": user_id, "results": rows}


def run_louvain(top_n: int = 20) -> dict:
    projection = _project_follows_graph(COMMUNITY_GRAPH, "UNDIRECTED")
    rows = run_read(
        "CALL gds.louvain.stream($graph_name) "
        "YIELD nodeId, communityId "
        "MATCH (u:User) WHERE id(u) = nodeId "
        "WITH communityId, collect({userId: u.userId, username: u.username}) AS users, count(*) AS size "
        "RETURN communityId, size, users[0..5] AS sampleUsers "
        "ORDER BY size DESC "
        "LIMIT $top_n",
        {"graph_name": COMMUNITY_GRAPH, "top_n": top_n},
    )
    return {"projection": projection, "results": rows}


def drop_graph(graph_name: str) -> dict:
    rows = run_write(
        "CALL gds.graph.drop($graph_name, false) "
        "YIELD graphName, nodeCount, relationshipCount "
        "RETURN graphName, nodeCount, relationshipCount",
        {"graph_name": graph_name},
    )
    return rows[0] if rows else {"graphName": graph_name, "dropped": False}
