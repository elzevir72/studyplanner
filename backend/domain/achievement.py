"""
달성률(achievement rate) 계산 — 순수 함수.

amount/goal_snapshot는 {"value": number, "unit": str} 형태.
unit이 다르거나 goal_snapshot이 없으면 계산 불가(None) — 에러가 아니라 "목표 미설정/단위 불일치"를 뜻한다.
"""
from typing import Optional


def calc_achievement_rate(amount: Optional[dict], goal_snapshot: Optional[dict]) -> Optional[int]:
    if not amount or not goal_snapshot:
        return None
    if amount.get("unit") != goal_snapshot.get("unit"):
        return None
    goal_value = goal_snapshot.get("value") or 0
    if goal_value == 0:
        return None
    return round(float(amount["value"]) / float(goal_value) * 100)


def average_achievement_rate(entries: list[dict]) -> Optional[int]:
    """
    entries: [{"amount": {...}, "goal_snapshot": {...} | None}, ...]
    계산 가능한(단위 일치) 일별 달성률의 평균. 계산 가능한 기록이 하나도 없으면 None.
    그룹/여러 참가자를 합산하는 함수가 아니라 참가자 한 명의 기간 내 개인 평균 전용.
    """
    rates = [
        rate
        for entry in entries
        if (rate := calc_achievement_rate(entry.get("amount"), entry.get("goal_snapshot"))) is not None
    ]
    if not rates:
        return None
    return round(sum(rates) / len(rates))
