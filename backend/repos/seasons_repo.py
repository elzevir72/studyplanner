"""Seasons 테이블 접근. 시즌 전환은 TransactWriteItems로 원자적 처리(동시에 두 시즌이 is_current=true가 되는 상태 방지)."""
import os
from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.types import TypeSerializer

from backend.common.db import table, client

TABLE_ENV = "SEASONS_TABLE"


def _table():
    return table(TABLE_ENV)


def _table_name() -> str:
    return os.environ[TABLE_ENV]


def list_seasons() -> list[dict]:
    resp = _table().scan()
    return resp.get("Items", [])


def get_season(season_id: str) -> dict | None:
    resp = _table().get_item(Key={"season_id": season_id})
    return resp.get("Item")


def get_current_season() -> dict | None:
    resp = _table().scan(FilterExpression=Attr("is_current").eq(True))
    items = resp.get("Items", [])
    return items[0] if items else None


def create_season(
    season_id: str,
    name: str,
    start_date: str,
    end_date: str,
    exam_date: str | None,
    target_level: str | None,
) -> dict:
    item = {
        "season_id": season_id,
        "name": name,
        "start_date": start_date,
        "end_date": end_date,
        "exam_date": exam_date,
        "target_level": target_level,
        "is_current": False,
    }
    _table().put_item(Item=item)
    return item


def activate_season(season_id: str) -> None:
    """기존 is_current=true 시즌을 false로 내리고 신규 시즌을 true로 올리는 두 쓰기를 원자적으로 묶는다."""
    current = get_current_season()
    serializer = TypeSerializer()
    table_name = _table_name()

    transact_items = []
    if current and current["season_id"] != season_id:
        transact_items.append(
            {
                "Update": {
                    "TableName": table_name,
                    "Key": {"season_id": serializer.serialize(current["season_id"])},
                    "UpdateExpression": "SET is_current = :false",
                    "ExpressionAttributeValues": {":false": serializer.serialize(False)},
                }
            }
        )
    transact_items.append(
        {
            "Update": {
                "TableName": table_name,
                "Key": {"season_id": serializer.serialize(season_id)},
                "UpdateExpression": "SET is_current = :true",
                "ExpressionAttributeValues": {":true": serializer.serialize(True)},
            }
        }
    )

    client().transact_write_items(TransactItems=transact_items)
