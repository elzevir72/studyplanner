"""Meetings 테이블 접근. 오프라인 모임 날짜/메모 — 참가자 누구나 등록/수정/삭제 가능."""
import uuid

from backend.common.db import table
from backend.common.time_utils import now_kst_iso

TABLE_ENV = "MEETINGS_TABLE"


def _table():
    return table(TABLE_ENV)


def list_meetings() -> list[dict]:
    resp = _table().scan()
    return resp.get("Items", [])


def get_meeting(meeting_id: str) -> dict | None:
    resp = _table().get_item(Key={"meeting_id": meeting_id})
    return resp.get("Item")


def create_meeting(date: str, memo: str) -> dict:
    item = {
        "meeting_id": uuid.uuid4().hex,
        "date": date,
        "memo": memo,
        "created_at": now_kst_iso(),
    }
    _table().put_item(Item=item)
    return item


def update_meeting(meeting_id: str, date: str, memo: str) -> dict:
    _table().update_item(
        Key={"meeting_id": meeting_id},
        UpdateExpression="SET #d = :date, memo = :memo",
        ExpressionAttributeNames={"#d": "date"},
        ExpressionAttributeValues={":date": date, ":memo": memo},
    )
    return get_meeting(meeting_id)


def delete_meeting(meeting_id: str) -> None:
    _table().delete_item(Key={"meeting_id": meeting_id})
