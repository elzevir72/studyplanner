"""Users 테이블 접근. 모든 목록/집계 조회는 status='active'인 유저만 대상으로 한다."""
from boto3.dynamodb.conditions import Attr

from backend.common.db import table
from backend.common.time_utils import now_kst_iso

TABLE_ENV = "USERS_TABLE"


def _table():
    return table(TABLE_ENV)


def get_user(user_id: str) -> dict | None:
    resp = _table().get_item(Key={"user_id": user_id})
    return resp.get("Item")


def list_active_users() -> list[dict]:
    resp = _table().scan(FilterExpression=Attr("status").eq("active"))
    return resp.get("Items", [])


def list_all_users() -> list[dict]:
    resp = _table().scan()
    return resp.get("Items", [])


def create_user(user_id: str, display_name: str, pin_hash: str) -> dict:
    item = {
        "user_id": user_id,
        "display_name": display_name,
        "pin_hash": pin_hash,
        "daily_goal": None,
        "status": "active",
        "created_at": now_kst_iso(),
    }
    _table().put_item(Item=item)
    return item


def update_user_status(user_id: str, status: str) -> None:
    _table().update_item(
        Key={"user_id": user_id},
        UpdateExpression="SET #s = :status",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":status": status},
    )


def update_pin(user_id: str, pin_hash: str) -> None:
    _table().update_item(
        Key={"user_id": user_id},
        UpdateExpression="SET pin_hash = :pin_hash",
        ExpressionAttributeValues={":pin_hash": pin_hash},
    )


def set_goal(user_id: str, goals: list[dict]) -> list[dict]:
    """goals: [{"method": str, "value": number, "unit": str}, ...] — 수단별 목표 전체를 통째로 교체."""
    _table().update_item(
        Key={"user_id": user_id},
        UpdateExpression="SET daily_goal = :goal",
        ExpressionAttributeValues={":goal": goals},
    )
    return goals
