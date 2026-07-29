from datetime import date

from backend.domain.periods import (
    week_range_from_iso,
    meeting_rounds,
    month_range_from_str,
)


def test_week_range_from_iso_monday_to_sunday():
    start, end = week_range_from_iso("2026-W03")
    assert start == date(2026, 1, 12)
    assert end == date(2026, 1, 18)
    assert start.weekday() == 0  # Monday
    assert end.weekday() == 6  # Sunday


def test_meeting_rounds_orders_and_labels_sequentially():
    meetings = [
        {"meeting_id": "m2", "date": "2026-08-03", "memo": "청해 특훈", "created_by": "u2"},
        {"meeting_id": "m1", "date": "2026-07-20", "memo": "문법 총정리", "created_by": "u1"},
    ]
    rounds = meeting_rounds(meetings, season_start="2026-07-01")
    assert rounds == [
        {
            "round": 1,
            "meeting_id": "m1",
            "date": "2026-07-20",
            "memo": "문법 총정리",
            "created_by": "u1",
            "from": "2026-07-01",
            "to": "2026-07-20",
        },
        {
            "round": 2,
            "meeting_id": "m2",
            "date": "2026-08-03",
            "memo": "청해 특훈",
            "created_by": "u2",
            "from": "2026-07-21",
            "to": "2026-08-03",
        },
    ]


def test_meeting_rounds_empty_list():
    assert meeting_rounds([], season_start="2026-07-01") == []


def test_meeting_rounds_single_meeting():
    meetings = [{"meeting_id": "m1", "date": "2026-07-20", "memo": "", "created_by": "u1"}]
    rounds = meeting_rounds(meetings, season_start="2026-07-01")
    assert rounds == [
        {
            "round": 1,
            "meeting_id": "m1",
            "date": "2026-07-20",
            "memo": "",
            "created_by": "u1",
            "from": "2026-07-01",
            "to": "2026-07-20",
        }
    ]


def test_month_range_from_str():
    start, end = month_range_from_str("2026-07")
    assert start == date(2026, 7, 1)
    assert end == date(2026, 7, 31)
