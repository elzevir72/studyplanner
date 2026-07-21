"""Admin 테이블 접근. 단일 아이템(admin_id='ADMIN')만 존재."""
from backend.common.db import table

TABLE_ENV = "ADMIN_TABLE"
ADMIN_ID = "ADMIN"


def _table():
    return table(TABLE_ENV)


def get_admin() -> dict | None:
    resp = _table().get_item(Key={"admin_id": ADMIN_ID})
    return resp.get("Item")


def set_admin_password(password_hash: str) -> None:
    """최초 생성/비밀번호 재설정을 겸하는 idempotent upsert. 시딩 스크립트에서만 호출된다."""
    _table().put_item(Item={"admin_id": ADMIN_ID, "password_hash": password_hash})
