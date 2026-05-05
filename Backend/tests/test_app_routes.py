def test_phase_3_routes_are_registered(app):
    routes = {str(rule) for rule in app.url_map.iter_rules()}

    assert "/api/queries/most-liked-posts" in routes
    assert "/api/queries/largest-groups" in routes
    assert "/api/gds/pagerank" in routes
    assert "/api/gds/node-similarity" in routes
