from datetime import date

from backend.domain.dday import calc_dday


def test_calc_dday_future():
    assert calc_dday("2026-08-01", date(2026, 7, 21)) == 11


def test_calc_dday_past_is_negative():
    assert calc_dday("2026-07-01", date(2026, 7, 21)) == -20


def test_calc_dday_none_when_no_exam_date():
    assert calc_dday(None, date(2026, 7, 21)) is None
