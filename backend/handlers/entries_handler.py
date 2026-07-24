from backend.common import responses
from backend.common.auth import require_participant, require_participant_self
from backend.common.errors import handle_errors
from backend.common.request import parse_body, path_params, query_params
from backend.repos import entries_repo, seasons_repo, users_repo


@handle_errors
def list_entries(event, context):
    require_participant(event)  # 조회는 본인 여부와 무관하게 그룹 내 공유 목적으로 개방
    user_id = path_params(event)["user_id"]
    q = query_params(event)
    entries = entries_repo.list_entries_for_user(user_id, q.get("from"), q.get("to"))
    return responses.ok(entries)


@handle_errors
def get_entry(event, context):
    require_participant(event)
    p = path_params(event)
    entry = entries_repo.get_entry(p["user_id"], p["date"])
    if not entry:
        return responses.not_found("entry not found")
    return responses.ok(entry)


@handle_errors
def put_entry(event, context):
    p = path_params(event)
    user_id, date = p["user_id"], p["date"]
    require_participant_self(event, user_id)

    body = parse_body(event)
    study_items = body.get("study_items")
    if not isinstance(study_items, list) or not study_items:
        raise ValueError("study_items must be a non-empty list of {method, topics, amount}")
    for item in study_items:
        if not item.get("method") or not item.get("amount"):
            raise ValueError("each study_item requires method and amount")

    user = users_repo.get_user(user_id)
    if not user:
        return responses.not_found("user not found")

    current_season = seasons_repo.get_current_season()
    if not current_season:
        raise ValueError("no active season configured")

    entry = entries_repo.put_entry(
        user_id=user_id,
        date=date,
        study_items=study_items,
        notes=body.get("notes", ""),
        goal_snapshot=user.get("daily_goal"),
        season_id=current_season["season_id"],
    )
    return responses.ok(entry)


@handle_errors
def delete_entry(event, context):
    p = path_params(event)
    user_id, date = p["user_id"], p["date"]
    require_participant_self(event, user_id)
    entries_repo.delete_entry(user_id, date)
    return responses.no_content()
