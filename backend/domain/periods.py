"""
주간/격주/월간 집계 기간 계산 — 순수 함수.

- 주간: ISO 8601 기준(월요일 시작).
- 격주: 현재 시즌의 start_date를 anchor로 한 2주 단위 (실제 오프라인 모임 주기와 일치, 기본/우선 뷰).
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


def biweekly_range(anchor_date: date, reference_date: date) -> tuple[date, date]:
    """anchor_date(시즌 start_date)로부터 2주 단위로 끊었을 때 reference_date가 속한 구간."""
    if reference_date < anchor_date:
        return anchor_date, anchor_date + timedelta(days=13)
    days_since_anchor = (reference_date - anchor_date).days
    period_index = days_since_anchor // 14
    start = anchor_date + timedelta(days=period_index * 14)
    end = start + timedelta(days=13)
    return start, end


def biweekly_range_from_start(start_str: str) -> tuple[date, date]:
    start = date.fromisoformat(start_str)
    return start, start + timedelta(days=13)


def month_range_from_str(month_str: str) -> tuple[date, date]:
    """'2026-07' -> (2026-07-01, 2026-07-31)"""
    year_str, month_str_ = month_str.split("-")
    year, month = int(year_str), int(month_str_)
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def month_range_containing(reference_date: date) -> tuple[date, date]:
    last_day = calendar.monthrange(reference_date.year, reference_date.month)[1]
    return reference_date.replace(day=1), reference_date.replace(day=last_day)
