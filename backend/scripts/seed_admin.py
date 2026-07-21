"""
관리자(Admin) 계정 최초 생성 / 비밀번호 재설정 겸용 수동 스크립트.

배포 파이프라인(GitHub Actions)에는 포함하지 않는다 — 배포 권한을 가진 사람이 로컬에서 1회 실행.
idempotent: 이미 계정이 있어도 그냥 덮어써서 "최초 생성"과 "비밀번호 분실 재설정"을 같은 스크립트로 처리한다.
(architecture.md ADR 14 참고)

사용법:
    cd backend
    python -m scripts.seed_admin --stage prod
"""
import argparse
import getpass
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common.auth import hash_secret  # noqa: E402
from backend.repos import admin_repo  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="관리자 계정 생성/비밀번호 재설정")
    parser.add_argument("--stage", default="dev", help="serverless stage (dev/prod). ADMIN_TABLE env var로 덮어쓸 수 있음")
    args = parser.parse_args()

    if "ADMIN_TABLE" not in os.environ:
        os.environ["ADMIN_TABLE"] = f"study-planner-{args.stage}-admin"

    print(f"대상 테이블: {os.environ['ADMIN_TABLE']}")
    password = getpass.getpass("새 관리자 비밀번호: ")
    confirm = getpass.getpass("비밀번호 확인: ")
    if password != confirm:
        print("비밀번호가 일치하지 않습니다.", file=sys.stderr)
        sys.exit(1)
    if len(password) < 8:
        print("비밀번호는 최소 8자 이상 권장합니다 (계속하려면 다시 실행하지 않고 Enter 없이 종료).", file=sys.stderr)
        sys.exit(1)

    admin_repo.set_admin_password(hash_secret(password))
    print("완료: 관리자 비밀번호가 설정/재설정되었습니다.")


if __name__ == "__main__":
    main()
