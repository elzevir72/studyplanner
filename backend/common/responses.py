"""API Gateway HTTP API (payload v2) 프록시 응답 헬퍼."""
import json
from decimal import Decimal
from typing import Any


def _default(obj: Any):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def _response(status: int, body: Any = None) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body if body is not None else {}, default=_default, ensure_ascii=False),
    }


def ok(body: Any = None) -> dict:
    return _response(200, body)


def created(body: Any = None) -> dict:
    return _response(201, body)


def no_content() -> dict:
    return {"statusCode": 204, "headers": {}, "body": ""}


def bad_request(message: str) -> dict:
    return _response(400, {"error": message})


def unauthorized(message: str = "unauthorized") -> dict:
    return _response(401, {"error": message})


def forbidden(message: str = "forbidden") -> dict:
    return _response(403, {"error": message})


def not_found(message: str = "not found") -> dict:
    return _response(404, {"error": message})


def server_error(message: str = "internal server error") -> dict:
    return _response(500, {"error": message})
