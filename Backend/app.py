import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import click
from flask import Flask
from flask_cors import CORS

from config import settings
from utils.errors import register_error_handlers


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["DEBUG"] = settings.flask_debug

    CORS(app, origins=settings.cors_origins_list)

    register_error_handlers(app)

    _register_blueprints(app)
    _register_cli(app)
    _register_health(app)

    return app


def _register_blueprints(app: Flask) -> None:
    pass


def _register_health(app: Flask) -> None:
    from db.neo4j_client import get_driver

    @app.get("/api/health")
    def health():
        from utils.responses import ok, error as err
        try:
            get_driver().verify_connectivity()
            return ok({"neo4j": "up"})
        except Exception as e:
            return err("NEO4J_DOWN", str(e), 503)


def _register_cli(app: Flask) -> None:
    @app.cli.command("init-db")
    def init_db():
        """Create constraints and indexes in Neo4j."""
        from db.neo4j_client import run_write
        cypher_path = os.path.join(os.path.dirname(__file__), "db", "constraints.cypher")
        with open(cypher_path) as f:
            statements = [s.strip() for s in f.read().split(";") if s.strip()]
        for stmt in statements:
            try:
                run_write(stmt)
            except Exception as e:
                click.echo(f"  warning: {e}", err=True)
        click.echo("constraints created")


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=settings.port, debug=settings.flask_debug)
