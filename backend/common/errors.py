"""핸들러 공통 에러 처리 데코레이터."""
import functools
import logging

from . import responses
from .auth import AuthError

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handle_errors(fn):
    @functools.wraps(fn)
    def wrapper(event, context):
        try:
            return fn(event, context)
        except AuthError as e:
            return responses.forbidden(e.message) if e.status == 403 else responses.unauthorized(e.message)
        except ValueError as e:
            return responses.bad_request(str(e))
        except Exception:
            logger.exception("unhandled error in %s", fn.__name__)
            return responses.server_error()

    return wrapper
