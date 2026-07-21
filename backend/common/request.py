"""API Gateway HTTP API (payload v2) 이벤트 파싱 헬퍼."""
import json


def parse_body(event: dict) -> dict:
    raw = event.get("body") or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("invalid JSON body")


def path_params(event: dict) -> dict:
    return event.get("pathParameters") or {}


def query_params(event: dict) -> dict:
    return event.get("queryStringParameters") or {}
