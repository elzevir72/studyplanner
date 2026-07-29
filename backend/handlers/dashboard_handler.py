from datetime import date

from backend.common import responses
from backend.common.errors import handle_errors
from backend.common.request import query_params
from backend.common.time_utils import now_kst
from backend.domain.dashboard import build_dashboard, not_participated
from backend.domain.periods import (
    meeting_rounds,
    month_range_containing,
    month_range_from_str,
    week_range_containing,
    week_range_from_iso,
)
from backend.repos import entries_repo, meetings_repo, seasons_repo, users_repo


def _dashboard_response(label_key: str, label_value: str, start: date, end: date) -> dict:
    users = users_repo.list_active_users()
    entries = entries_repo.list_entries_by_date_range(start.isoformat(), end.isoformat())
    participants = build_dashboard(users, entries)
    return {
        label_key: label_value,
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "participants": participants,
        "not_participated": not_participated(participants),
    }


@handle_errors
def weekly(event, context):
    q = query_params(event)
    week = q.get("week")
    if week:
        start, end = week_range_from_iso(week)
    else:
        start, end = week_range_containing(now_kst().date())
        week = f"{start.isocalendar().year}-W{start.isocalendar().week:02d}"
    return responses.ok(_dashboard_response("week", week, start, end))


@handle_errors
def list_meetings(event, context):
    """등록된 오프라인 모임 목록 (관리자 페이지에서 이미 등록된 모임을 보여줄 때 사용)."""
    meetings = meetings_repo.list_meetings()
    meetings.sort(key=lambda m: m["date"])
    return responses.ok(meetings)


@handle_errors
def meeting_rounds_dashboard(event, context):
    """오프라인 모임 회차별 요약 목록. 각 회차의 구간(from~to) 기준으로 참가자별 집계를 낸다."""
    current_season = seasons_repo.get_current_season()
    if not current_season:
        raise ValueError("no active season configured")

    meetings = meetings_repo.list_meetings()
    rounds = meeting_rounds([m["date"] for m in meetings], season_start=current_season["start_date"])
    memo_by_date = {m["date"]: m.get("memo", "") for m in meetings}

    result = []
    for r in rounds:
        start = date.fromisoformat(r["from"])
        end = date.fromisoformat(r["to"])
        dashboard = _dashboard_response("round", r["round"], start, end)
        dashboard["memo"] = memo_by_date.get(r["date"], "")
        result.append(dashboard)

    return responses.ok(result)


@handle_errors
def monthly(event, context):
    q = query_params(event)
    month = q.get("month")
    if month:
        start, end = month_range_from_str(month)
    else:
        start, end = month_range_containing(now_kst().date())
        month = f"{start.year}-{start.month:02d}"
    return responses.ok(_dashboard_response("month", month, start, end))


@handle_errors
def feed(event, context):
    q = query_params(event)
    date_from = q.get("from")
    date_to = q.get("to")
    if not date_from or not date_to:
        raise ValueError("from and to are required")

    active_users = users_repo.list_active_users()
    active_ids = {u["user_id"] for u in active_users}
    display_names = {u["user_id"]: u["display_name"] for u in active_users}
    entries = entries_repo.list_entries_by_date_range(date_from, date_to)

    feed_items = [
        {
            "user_id": e["user_id"],
            "display_name": display_names.get(e["user_id"], e["user_id"]),
            "date": e["date"],
            "notes": e["notes"],
        }
        for e in entries
        if e.get("notes") and e["user_id"] in active_ids
    ]
    feed_items.sort(key=lambda item: item["date"], reverse=True)
    return responses.ok(feed_items)
