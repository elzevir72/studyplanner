from backend.domain.achievement import (
    average_achievement_rate,
    calc_achievement_rate,
    calc_entry_achievement_rate,
)


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


def test_calc_entry_achievement_rate_averages_across_methods():
    # 인강 6/30분=20%, 문제집 5/10페이지=50% -> 평균 35%
    study_items = [
        {"method": "인강", "topics": ["문법"], "amount": {"value": 6, "unit": "분"}},
        {"method": "문제집", "topics": ["어휘"], "amount": {"value": 5, "unit": "페이지"}},
    ]
    goal_snapshot = [
        {"method": "인강", "value": 30, "unit": "분"},
        {"method": "문제집", "value": 10, "unit": "페이지"},
    ]
    assert calc_entry_achievement_rate(study_items, goal_snapshot) == 35


def test_calc_entry_achievement_rate_missing_method_counts_as_zero():
    # 목표엔 문제집도 있지만 오늘은 인강만 기록 -> 인강 100%, 문제집 0% -> 평균 50%
    study_items = [{"method": "인강", "topics": [], "amount": {"value": 30, "unit": "분"}}]
    goal_snapshot = [
        {"method": "인강", "value": 30, "unit": "분"},
        {"method": "문제집", "value": 10, "unit": "페이지"},
    ]
    assert calc_entry_achievement_rate(study_items, goal_snapshot) == 50


def test_calc_entry_achievement_rate_unit_mismatch_excluded():
    study_items = [{"method": "인강", "topics": [], "amount": {"value": 30, "unit": "페이지"}}]
    goal_snapshot = [{"method": "인강", "value": 30, "unit": "분"}]
    assert calc_entry_achievement_rate(study_items, goal_snapshot) is None


def test_calc_entry_achievement_rate_no_goal_returns_none():
    study_items = [{"method": "인강", "topics": [], "amount": {"value": 30, "unit": "분"}}]
    assert calc_entry_achievement_rate(study_items, None) is None
    assert calc_entry_achievement_rate(study_items, []) is None


def test_average_achievement_rate_ignores_unmatched_units():
    entries = [
        {
            "study_items": [{"method": "인강", "topics": [], "amount": {"value": 60, "unit": "분"}}],
            "goal_snapshot": [{"method": "인강", "value": 120, "unit": "분"}],
        },  # 50
        {
            "study_items": [{"method": "인강", "topics": [], "amount": {"value": 5, "unit": "페이지"}}],
            "goal_snapshot": [{"method": "인강", "value": 120, "unit": "분"}],
        },  # None (단위 불일치, 목표 수단은 있는데 기록 수단명이 같아 매칭되지만 단위가 달라 제외)
        {
            "study_items": [{"method": "인강", "topics": [], "amount": {"value": 120, "unit": "분"}}],
            "goal_snapshot": [{"method": "인강", "value": 120, "unit": "분"}],
        },  # 100
    ]
    assert average_achievement_rate(entries) == 75


def test_average_achievement_rate_empty_returns_none():
    assert average_achievement_rate([]) is None
