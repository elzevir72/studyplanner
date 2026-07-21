from backend.common import responses
from backend.common.errors import handle_errors
from backend.common.request import path_params
from backend.common.time_utils import now_kst
from backend.domain.dashboard import build_dashboard
from backend.domain.dday import calc_dday
from backend.repos import entries_repo, seasons_repo, users_repo


def _with_dday(season: dict) -> dict:
    return {**season, "d_day": calc_dday(season.get("exam_date"), now_kst().date())}


@handle_errors
def list_seasons(event, context):
    return responses.ok(seasons_repo.list_seasons())


@handle_errors
def current_season(event, context):
    season = seasons_repo.get_current_season()
    if not season:
        return responses.not_found("no current season")
    return responses.ok(_with_dday(season))


@handle_errors
def season_dashboard(event, context):
    season_id = path_params(event)["season_id"]
    season = seasons_repo.get_season(season_id)
    if not season:
        return responses.not_found("season not found")

    entries = [
        e
        for e in entries_repo.list_entries_by_date_range(season["start_date"], season["end_date"])
        if e.get("season_id") == season_id
    ]
    users = users_repo.list_active_users()
    participants = build_dashboard(users, entries)

    return responses.ok({"season": _with_dday(season), "participants": participants})
