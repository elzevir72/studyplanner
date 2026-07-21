from backend.domain.achievement import calc_achievement_rate, average_achievement_rate


def test_calc_achievement_rate_basic():
    assert calc_achievement_rate({"value": 60, "unit": "분"}, {"value": 120, "unit": "분"}) == 50


def test_calc_achievement_rate_unit_mismatch_returns_none():
    assert calc_achievement_rate({"value": 60, "unit": "분"}, {"value": 5, "unit": "페이지"}) is None


def test_calc_achievement_rate_no_goal_returns_none():
    assert calc_achievement_rate({"value": 60, "unit": "분"}, None) is None


def test_calc_achievement_rate_zero_goal_returns_none():
    assert calc_achievement_rate({"value": 60, "unit": "분"}, {"value": 0, "unit": "분"}) is None


def test_calc_achievement_rate_rounds():
    assert calc_achievement_rate({"value": 100, "unit": "분"}, {"value": 3, "unit": "분"}) == 3333


def test_average_achievement_rate_ignores_unmatched_units():
    entries = [
        {"amount": {"value": 60, "unit": "분"}, "goal_snapshot": {"value": 120, "unit": "분"}},  # 50
        {"amount": {"value": 5, "unit": "페이지"}, "goal_snapshot": {"value": 120, "unit": "분"}},  # None
        {"amount": {"value": 120, "unit": "분"}, "goal_snapshot": {"value": 120, "unit": "분"}},  # 100
    ]
    assert average_achievement_rate(entries) == 75


def test_average_achievement_rate_empty_returns_none():
    assert average_achievement_rate([]) is None
