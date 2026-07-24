from backend.common import responses
from backend.common.auth import require_participant_self, verify_secret, hash_secret
from backend.common.errors import handle_errors
from backend.common.request import parse_body, path_params
from backend.repos import users_repo


@handle_errors
def list_users(event, context):
    users = users_repo.list_active_users()
    return responses.ok([{"user_id": u["user_id"], "display_name": u["display_name"]} for u in users])


@handle_errors
def change_pin(event, context):
    user_id = path_params(event)["user_id"]
    require_participant_self(event, user_id)

    body = parse_body(event)
    current_pin = body.get("current_pin")
    new_pin = body.get("new_pin")
    if not current_pin or not new_pin:
        raise ValueError("current_pin and new_pin are required")

    user = users_repo.get_user(user_id)
    if not user or not verify_secret(current_pin, user.get("pin_hash", "")):
        return responses.unauthorized("current_pin is incorrect")

    users_repo.update_pin(user_id, hash_secret(new_pin))
    return responses.ok({"status": "updated"})


@handle_errors
def get_goal(event, context):
    user_id = path_params(event)["user_id"]
    user = users_repo.get_user(user_id)
    if not user:
        return responses.not_found("user not found")
    return responses.ok(user.get("daily_goal"))


@handle_errors
def set_goal(event, context):
    user_id = path_params(event)["user_id"]
    require_participant_self(event, user_id)

    body = parse_body(event)
    goals = body.get("goals")
    if not isinstance(goals, list) or not goals:
        raise ValueError("goals must be a non-empty list of {method, value, unit}")
    for g in goals:
        if not g.get("method") or g.get("value") is None or not g.get("unit"):
            raise ValueError("each goal requires method, value and unit")

    saved = users_repo.set_goal(user_id, goals)
    return responses.ok(saved)
