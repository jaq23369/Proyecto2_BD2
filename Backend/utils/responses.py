from flask import jsonify, Response


def ok(data=None) -> tuple[Response, int]:
    return jsonify({"ok": True, "data": data}), 200


def created(data=None) -> tuple[Response, int]:
    return jsonify({"ok": True, "data": data}), 201


def no_content() -> tuple[Response, int]:
    return jsonify({"ok": True, "data": None}), 204


def error(code: str, message: str, status: int = 400) -> tuple[Response, int]:
    return jsonify({"ok": False, "error": {"code": code, "message": message}}), status
