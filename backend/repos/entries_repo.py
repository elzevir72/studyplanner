"""
Entries 테이블 접근.

goal_snapshot/season_id 자동 채움 같은 비즈니스 규칙은 여기서 처리하지 않는다 —
그건 여러 repo(users/seasons)를 조합해야 하는 핸들러의 책임이고, 이 모듈은 순수 I/O만 담당한다.
"""
from boto3.dynamodb.conditions import Key

from backend.common.db import table
from backend.common.time_utils import now_kst_iso

TABLE_ENV = "ENTRIES_TABLE"
GSI_NAME = "ByDate"
GSI_PK_VALUE = "ENTRY"


def _table():
    return table(TABLE_ENV)


def get_entry(user_id: str, date: str) -> dict | None:
    resp = _table().get_item(Key={"user_id": user_id, "date": date})
    return resp.get("Item")


def list_entries_for_user(user_id: str, date_from: str | None = None, date_to: str | None = None) -> list[dict]:
    condition = Key("user_id").eq(user_id)
    if date_from and date_to:
        condition = condition & Key("date").between(date_from, date_to)
    resp = _table().query(KeyConditionExpression=condition)
    return resp.get("Items", [])


def list_entries_by_date_range(date_from: str, date_to: str) -> list[dict]:
    """전체 유저의 기간 내 기록 — 대시보드 집계/미수행자 판정/공유 피드용."""
    resp = _table().query(
        IndexName=GSI_NAME,
        KeyConditionExpression=Key("gsi_pk").eq(GSI_PK_VALUE) & Key("date").between(date_from, date_to),
    )
    return resp.get("Items", [])


def put_entry(
    user_id: str,
    date: str,
    study_items: list[dict],
    notes: str,
    goal_snapshot: list[dict] | None,
    season_id: str,
) -> dict:
    """study_items: [{"method": str, "topics": [str], "amount": {"value", "unit"}}, ...]"""
    now = now_kst_iso()
    resp = _table().update_item(
        Key={"user_id": user_id, "date": date},
        UpdateExpression=(
            "SET study_items = :si, notes = :nt, "
            "goal_snapshot = :gs, season_id = :sid, gsi_pk = :gp, "
            "created_at = if_not_exists(created_at, :now), updated_at = :now"
        ),
        ExpressionAttributeValues={
            ":si": study_items,
            ":nt": notes,
            ":gs": goal_snapshot,
            ":sid": season_id,
            ":gp": GSI_PK_VALUE,
            ":now": now,
        },
        ReturnValues="ALL_NEW",
    )
    return resp["Attributes"]


def delete_entry(user_id: str, date: str) -> None:
    _table().delete_item(Key={"user_id": user_id, "date": date})
