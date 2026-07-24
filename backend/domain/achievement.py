"""
달성률(achievement rate) 계산 — 순수 함수.

기록(Entry)은 수단(method)별로 여러 항목(study_items)을 가질 수 있고, 목표(goal_snapshot)도
수단별로 여러 개 설정될 수 있다. 예: 인강 목표 30분 중 6분 학습 = 20%, 문제집 목표 10페이지
중 5페이지 = 50% → 이 기록의 달성률은 각 수단별 비율의 평균(35%).

- 목표에 있는 수단인데 그날 기록이 없으면 0%로 취급해 평균에 포함한다(목표를 안 채운 것도
  달성률에 반영되어야 하므로).
- 수단은 있는데 단위가 다르면(목표와 기록의 unit 불일치) 그 수단은 비교 불가라 평균에서 제외한다.
- 목표(goal_snapshot) 자체가 없거나 비어 있으면 달성률 없음(None) — "목표 미설정".
"""
from typing import Optional


def calc_achievement_rate(amount: Optional[dict], goal: Optional[dict]) -> Optional[int]:
    """단일 수단의 amount({value, unit})와 goal({value, unit})으로 달성률(%) 계산."""
    if not amount or not goal:
        return None
    if amount.get("unit") != goal.get("unit"):
        return None
    goal_value = goal.get("value") or 0
    if goal_value == 0:
        return None
    return round(float(amount["value"]) / float(goal_value) * 100)


def calc_entry_achievement_rate(study_items: list[dict], goal_snapshot: Optional[list[dict]]) -> Optional[int]:
    """
    study_items: [{"method": str, "topics": [...], "amount": {"value", "unit"}}, ...]
    goal_snapshot: [{"method": str, "value": number, "unit": str}, ...] | None

    목표의 각 수단에 대해 그날 기록된 amount(없으면 0)로 비율을 구하고 평균을 낸다.
    단위가 다른 수단은 비교 불가로 평균에서 제외. 계산 가능한 수단이 하나도 없으면 None.
    """
    if not goal_snapshot:
        return None

    amounts_by_method = {item["method"]: item.get("amount") for item in study_items}

    rates: list[int] = []
    for goal in goal_snapshot:
        method = goal.get("method")
        amount = amounts_by_method.get(method)
        if amount is None:
            # 목표는 있는데 그 수단으로 기록을 안 남긴 경우 — 0%로 평균에 포함
            if goal.get("unit") is not None:
                rates.append(0)
            continue
        rate = calc_achievement_rate(amount, goal)
        if rate is not None:
            rates.append(rate)

    if not rates:
        return None
    return round(sum(rates) / len(rates))


def average_achievement_rate(entries: list[dict]) -> Optional[int]:
    """
    entries: [{"study_items": [...], "goal_snapshot": [...] | None}, ...]
    계산 가능한 일별 달성률의 평균. 계산 가능한 기록이 하나도 없으면 None.
    그룹/여러 참가자를 합산하는 함수가 아니라 참가자 한 명의 기간 내 개인 평균 전용.
    """
    rates = [
        rate
        for entry in entries
        if (rate := calc_entry_achievement_rate(entry.get("study_items", []), entry.get("goal_snapshot"))) is not None
    ]
    if not rates:
        return None
    return round(sum(rates) / len(rates))
