"""
인증/인가 공통 모듈.

- 참가자(participant) 토큰과 관리자(admin) 토큰은 role 클레임으로 스코프가 분리되며,
  서로의 엔드포인트에서 재사용될 수 없다 (require_participant_self / require_admin 참고).
- PIN(참가자)과 비밀번호(관리자) 모두 bcrypt 해시로 저장/검증한다.
"""
import os
import bcrypt
import jwt

from .time_utils import now_kst

JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"

PARTICIPANT_TOKEN_TTL_SECONDS = 60 * 60 * 12  # 12시간 — 짧은 TTL, 만료 시 사용자 선택 화면으로
ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 2  # 관리자 토큰은 파급력이 커서 더 짧게


class AuthError(Exception):
    def __init__(self, message: str, status: int = 401):
        super().__init__(message)
        self.message = message
        self.status = status


# ---------- 해시 (PIN / 관리자 비밀번호 공용) ----------

def hash_secret(raw: str) -> str:
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_secret(raw: str, hashed: str) -> bool:
    if not raw or not hashed:
        return False
    return bcrypt.checkpw(raw.encode("utf-8"), hashed.encode("utf-8"))


# ---------- 토큰 발급 ----------

def _encode(claims: dict, ttl_seconds: int) -> str:
    now = now_kst()
    payload = {
        **claims,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp()) + ttl_seconds,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def issue_participant_token(user_id: str) -> str:
    return _encode({"sub": user_id, "role": "participant"}, PARTICIPANT_TOKEN_TTL_SECONDS)


def issue_admin_token() -> str:
    return _encode({"sub": "ADMIN", "role": "admin"}, ADMIN_TOKEN_TTL_SECONDS)


def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise AuthError("token expired", status=401)
    except jwt.InvalidTokenError:
        raise AuthError("invalid token", status=401)


# ---------- 이벤트에서 토큰 추출 (API Gateway HTTP API v2 payload) ----------

def _bearer_token(event: dict) -> str:
    headers = event.get("headers") or {}
    header_value = headers.get("authorization") or headers.get("Authorization")
    if not header_value or not header_value.lower().startswith("bearer "):
        raise AuthError("missing bearer token", status=401)
    return header_value.split(" ", 1)[1].strip()


# ---------- 핸들러에서 쓰는 인가 헬퍼 ----------

def require_participant(event: dict) -> str:
    """유효한 참가자 토큰인지만 확인하고 user_id(sub)를 반환한다."""
    claims = _decode(_bearer_token(event))
    if claims.get("role") != "participant":
        raise AuthError("participant token required", status=403)
    return claims["sub"]


def require_participant_self(event: dict, path_user_id: str) -> str:
    """쓰기 엔드포인트용 — 토큰의 user_id와 경로 파라미터가 일치할 때만 통과."""
    user_id = require_participant(event)
    if user_id != path_user_id:
        raise AuthError("cannot modify another user's data", status=403)
    return user_id


def require_admin(event: dict) -> None:
    claims = _decode(_bearer_token(event))
    if claims.get("role") != "admin":
        raise AuthError("admin token required", status=403)
