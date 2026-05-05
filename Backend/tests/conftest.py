import os
import sys
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("NEO4J_URI", "bolt://localhost:7687")
os.environ.setdefault("NEO4J_USERNAME", "neo4j")
os.environ.setdefault("NEO4J_PASSWORD", "password")
os.environ.setdefault("NEO4J_DATABASE", "neo4j")


@pytest.fixture()
def app():
    from app import create_app

    app = create_app()
    app.config.update(TESTING=True)
    return app


@pytest.fixture()
def client(app):
    return app.test_client()
