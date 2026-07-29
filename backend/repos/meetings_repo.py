"""Meetings 테이블 접근. 관리자가 등록하는 오프라인 모임 날짜/메모."""
import uuid

from backend.common.db import table
from backend.common.time_utils import now_kst_iso

TABLE_ENV = "MEETINGS_TABLE"


def _table():
    return table(TABLE_ENV)


def list_meetings() -> list[dict]:
    resp = _table().scan()
    return resp.get("Items", [])


def create_meeting(date: str, memo: str) -> dict:
    item = {
        "meeting_id": uuid.uuid4().hex,
        "date": date,
        "memo": memo,
        "created_at": now_kst_iso(),
    }
    _table().put_item(Item=item)
    return item
