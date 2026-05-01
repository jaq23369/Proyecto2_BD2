from flask import Flask
from pydantic import ValidationError
from utils.responses import error


class NotFoundError(Exception):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message)
        self.message = message


class ValidationFailed(Exception):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message)
        self.message = message


class ConflictError(Exception):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message)
        self.message = message


class InvalidLabelError(Exception):
    def __init__(self, label: str):
        super().__init__(f"Invalid label or relationship type: '{label}'")
        self.message = f"Invalid label or relationship type: '{label}'"


class Neo4jServiceError(Exception):
    def __init__(self, message: str = "Database error"):
        super().__init__(message)
        self.message = message


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(NotFoundError)
    def handle_not_found(e: NotFoundError):
        return error("NOT_FOUND", e.message, 404)

    @app.errorhandler(ValidationFailed)
    def handle_validation(e: ValidationFailed):
        return error("VALIDATION_FAILED", e.message, 400)

    @app.errorhandler(ConflictError)
    def handle_conflict(e: ConflictError):
        return error("CONFLICT", e.message, 409)

    @app.errorhandler(InvalidLabelError)
    def handle_invalid_label(e: InvalidLabelError):
        return error("INVALID_LABEL", e.message, 400)

    @app.errorhandler(Neo4jServiceError)
    def handle_neo4j(e: Neo4jServiceError):
        return error("DATABASE_ERROR", e.message, 500)

    @app.errorhandler(ValidationError)
    def handle_pydantic(e: ValidationError):
        return error("VALIDATION_FAILED", str(e), 400)

    @app.errorhandler(404)
    def handle_404(_e):
        return error("NOT_FOUND", "Route not found", 404)

    @app.errorhandler(405)
    def handle_405(_e):
        return error("METHOD_NOT_ALLOWED", "Method not allowed", 405)

    @app.errorhandler(500)
    def handle_500(_e):
        return error("INTERNAL_ERROR", "Internal server error", 500)
