from backend.common import responses
from backend.common.auth import issue_participant_token, verify_secret
from backend.common.errors import handle_errors
from backend.common.request import parse_body
from backend.repos import users_repo


@handle_errors
def verify(event, context):
    body = parse_body(event)
    user_id = body.get("user_id")
    pin = body.get("pin")
    if not user_id or not pin:
        raise ValueError("user_id and pin are required")

    user = users_repo.get_user(user_id)
    if not user or not verify_secret(pin, user.get("pin_hash", "")):
        return responses.unauthorized("invalid user_id or pin")

    token = issue_participant_token(user_id)
    return responses.ok({"token": token, "user_id": user_id, "display_name": user["display_name"]})
