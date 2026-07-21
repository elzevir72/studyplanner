"""KST(Asia/Seoul) 기준 시간 유틸. 날짜 경계(자정) 판단은 항상 이 모듈을 거친다."""
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))


def now_kst() -> datetime:
    return datetime.now(tz=KST)


def today_kst_str() -> str:
    """YYYY-MM-DD"""
    return now_kst().date().isoformat()


def now_kst_iso() -> str:
    return now_kst().isoformat()
