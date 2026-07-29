"""
주간/월간/오프라인 모임 회차 집계 기간 계산 — 순수 함수.

- 주간: ISO 8601 기준(월요일 시작).
- 오프라인 모임 회차: 관리자가 등록한 모임 날짜들을 정렬해 회차를 나눔. 각 회차 구간은
  "직전 모임 다음날 ~ 이번 모임 날짜"(첫 회차는 시즌 시작일부터). 실제 모임 주기가
  불규칙할 수 있어 고정 간격(2주) 계산 대신 관리자가 등록한 날짜를 그대로 anchor로 쓴다.
- 월간: 달력월(1일~말일).
"""
import calendar
from datetime import date, timedelta
from typing import Optional


def week_range_from_iso(iso_week: str) -> tuple[date, date]:
    """'2026-W03' -> (월요일, 일요일)"""
    year_str, week_str = iso_week.split("-W")
    year, week = int(year_str), int(week_str)
    start = date.fromisocalendar(year, week, 1)
    end = date.fromisocalendar(year, week, 7)
    return start, end


def week_range_containing(reference_date: date) -> tuple[date, date]:
    iso = reference_date.isocalendar()
    start = date.fromisocalendar(iso.year, iso.week, 1)
    end = start + timedelta(days=6)
    return start, end


def meeting_rounds(meeting_dates: list[str], season_start: str) -> list[dict]:
    """
    meeting_dates: 오프라인 모임 날짜 문자열 목록(YYYY-MM-DD, 순서 무관).
    season_start: 현재 시즌 시작일 — 1회차의 구간 시작점.

    날짜순 정렬 후 회차를 매기고, 각 회차의 집계 구간(from~to)을 계산한다.
    구간은 "직전 회차 다음날 ~ 이번 회차 날짜"(1회차는 시즌 시작일부터 해당 모임 날짜까지).
    반환: [{"round": 1, "date": "2026-07-20", "from": "2026-07-01", "to": "2026-07-20"}, ...]
    """
    sorted_dates = sorted(meeting_dates)
    start_boundary = date.fromisoformat(season_start)

    rounds = []
    for i, meeting_date_str in enumerate(sorted_dates, start=1):
        rounds.append(
            {
                "round": i,
                "date": meeting_date_str,
                "from": start_boundary.isoformat(),
                "to": meeting_date_str,
            }
        )
        start_boundary = date.fromisoformat(meeting_date_str) + timedelta(days=1)
    return rounds


def month_range_from_str(month_str: str) -> tuple[date, date]:
    """'2026-07' -> (2026-07-01, 2026-07-31)"""
    year_str, month_str_ = month_str.split("-")
    year, month = int(year_str), int(month_str_)
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def month_range_containing(reference_date: date) -> tuple[date, date]:
    last_day = calendar.monthrange(reference_date.year, reference_date.month)[1]
    return reference_date.replace(day=1), reference_date.replace(day=last_day)
