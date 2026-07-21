from datetime import date

from backend.domain.periods import (
    week_range_from_iso,
    biweekly_range,
    month_range_from_str,
)


def test_week_range_from_iso_monday_to_sunday():
    start, end = week_range_from_iso("2026-W03")
    assert start == date(2026, 1, 12)
    assert end == date(2026, 1, 18)
    assert start.weekday() == 0  # Monday
    assert end.weekday() == 6  # Sunday


def test_biweekly_range_first_window():
    anchor = date(2026, 7, 6)
    start, end = biweekly_range(anchor, date(2026, 7, 10))
    assert start == date(2026, 7, 6)
    assert end == date(2026, 7, 19)


def test_biweekly_range_second_window():
    anchor = date(2026, 7, 6)
    start, end = biweekly_range(anchor, date(2026, 7, 20))
    assert start == date(2026, 7, 20)
    assert end == date(2026, 8, 2)


def test_month_range_from_str():
    start, end = month_range_from_str("2026-07")
    assert start == date(2026, 7, 1)
    assert end == date(2026, 7, 31)
