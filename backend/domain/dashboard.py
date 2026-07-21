"""대시보드 참가자별 요약 — 순수 함수. 그룹 전체를 합산하는 함수는 만들지 않는다(참가자별 개별 수치)."""
from .achievement import average_achievement_rate


def build_participant_summary(user: dict, entries_in_range: list[dict]) -> dict:
    return {
        "user_id": user["user_id"],
        "display_name": user["display_name"],
        "entry_count": len(entries_in_range),
        "achievement_rate": average_achievement_rate(entries_in_range),
    }


def not_participated(participants: list[dict]) -> list[str]:
    return [p["user_id"] for p in participants if p["entry_count"] == 0]


def build_dashboard(users: list[dict], entries: list[dict]) -> list[dict]:
    """users: status=active인 유저 목록, entries: 기간 내 전체 유저 기록. 참가자별 요약 리스트를 만든다."""
    entries_by_user: dict[str, list[dict]] = {}
    for entry in entries:
        entries_by_user.setdefault(entry["user_id"], []).append(entry)
    return [build_participant_summary(user, entries_by_user.get(user["user_id"], [])) for user in users]
