from backend.common import responses
from backend.common.auth import hash_secret, issue_admin_token, require_admin, verify_secret
from backend.common.errors import handle_errors
from backend.common.request import parse_body, path_params
from backend.repos import admin_repo, seasons_repo, users_repo

VALID_STATUSES = {"active", "inactive"}


@handle_errors
def verify(event, context):
    body = parse_body(event)
    password = body.get("password")
    if not password:
        raise ValueError("password is required")

    admin = admin_repo.get_admin()
    if not admin or not verify_secret(password, admin.get("password_hash", "")):
        return responses.unauthorized("invalid password")

    return responses.ok({"token": issue_admin_token()})


@handle_errors
def create_user(event, context):
    require_admin(event)
    body = parse_body(event)
    user_id, display_name, pin = body.get("user_id"), body.get("display_name"), body.get("pin")
    if not user_id or not display_name or not pin:
        raise ValueError("user_id, display_name and pin are required")

    if users_repo.get_user(user_id):
        raise ValueError(f"user '{user_id}' already exists")

    user = users_repo.create_user(user_id, display_name, hash_secret(pin))
    return responses.created({k: v for k, v in user.items() if k != "pin_hash"})


@handle_errors
def list_all_users(event, context):
    require_admin(event)
    users = users_repo.list_all_users()
    return responses.ok(
        [{"user_id": u["user_id"], "display_name": u["display_name"], "status": u["status"]} for u in users]
    )


@handle_errors
def update_user_status(event, context):
    require_admin(event)
    user_id = path_params(event)["user_id"]
    status = parse_body(event).get("status")
    if status not in VALID_STATUSES:
        raise ValueError(f"status must be one of {VALID_STATUSES}")

    if not users_repo.get_user(user_id):
        return responses.not_found("user not found")

    users_repo.update_user_status(user_id, status)
    return responses.ok({"user_id": user_id, "status": status})


@handle_errors
def create_season(event, context):
    require_admin(event)
    body = parse_body(event)
    season_id, name = body.get("season_id"), body.get("name")
    start_date, end_date = body.get("start_date"), body.get("end_date")
    if not season_id or not name or not start_date or not end_date:
        raise ValueError("season_id, name, start_date and end_date are required")

    season = seasons_repo.create_season(
        season_id=season_id,
        name=name,
        start_date=start_date,
        end_date=end_date,
        exam_date=body.get("exam_date"),
        target_level=body.get("target_level"),
    )
    return responses.created(season)


@handle_errors
def activate_season(event, context):
    require_admin(event)
    season_id = path_params(event)["season_id"]
    if not seasons_repo.get_season(season_id):
        return responses.not_found("season not found")

    seasons_repo.activate_season(season_id)
    return responses.ok({"season_id": season_id, "is_current": True})
