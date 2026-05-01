import atexit
from neo4j import GraphDatabase, Driver
from config import settings

_driver: Driver | None = None


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
        )
        _driver.verify_connectivity()
        atexit.register(_close_driver)
    return _driver


def _close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


def run_read(cypher: str, params: dict | None = None) -> list[dict]:
    with get_driver().session(database=settings.neo4j_database) as session:
        result = session.execute_read(_run_tx, cypher, params or {})
    return result


def run_write(cypher: str, params: dict | None = None) -> list[dict]:
    with get_driver().session(database=settings.neo4j_database) as session:
        result = session.execute_write(_run_tx, cypher, params or {})
    return result


def _run_tx(tx, cypher: str, params: dict) -> list[dict]:
    result = tx.run(cypher, **params)
    return [record.data() for record in result]
