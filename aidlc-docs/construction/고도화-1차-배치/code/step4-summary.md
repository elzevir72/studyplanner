# Step 4 Summary — 관리자 드롭다운 + 신규 엔드포인트 (FR-3)

## 변경 파일
- **Modified**: [backend/handlers/admin_handler.py](../../../../backend/handlers/admin_handler.py) — `list_all_users` 함수 추가 (`require_admin` → `users_repo.list_all_users()` → `user_id`/`display_name`/`status`만 응답, `pin_hash` 등 제외)
- **Modified**: [serverless.yml](../../../../serverless.yml) — `adminListAllUsers` 함수 정의 및 `GET /api/admin/users` 라우트 추가 (경로 값 따옴표 처리, 기존 관례 준수)
- **Modified**: [frontend/src/types.ts](../../../../frontend/src/types.ts) — `AdminUserSummary` 인터페이스 추가
- **Modified**: [frontend/src/api/client.ts](../../../../frontend/src/api/client.ts) — `adminListAllUsers(token)` 함수 추가
- **Modified**: [frontend/src/pages/AdminPage.tsx](../../../../frontend/src/pages/AdminPage.tsx) — `UpdateUserStatusForm`을 드롭다운으로 전환. 참가자 선택 시 그 참가자의 현재 상태로 status select를 초기화(Q-3=B), 상태 변경 성공 시 로컬 `users` 목록도 갱신해 재조회 없이 드롭다운 라벨이 최신 상태를 반영하도록 처리

## 근거
- [functional-design/frontend-components.md](../functional-design/frontend-components.md) — 드롭다운 상태 흐름 코드 스케치
- [application-design/services.md](../../../inception/application-design/services.md) — 명명 규칙, 핸들러 위치
- [application-design/component-dependency.md](../../../inception/application-design/component-dependency.md) — IAM 권한 불필요 확인 사항

## 테스트
- `python -m py_compile backend/handlers/admin_handler.py` — 문법 통과
- YAML 파서로 `serverless.yml` 문법 검증 — 통과, `adminListAllUsers` 함수 정의 정확히 반영 확인
- `npx tsc --noEmit` — 타입 에러 없음
- 브라우저 렌더링 확인 — 관리자 화면 크래시 없음, "참가자 상태 변경" 섹션이 드롭다운으로 정상 전환됨 확인(API 미기동으로 목록은 비어있으나 UI 구조 정상)
- Reverse Engineering에서 지적된 handlers 테스트 부재 관례에 따라, 이번 신규 핸들러도 자동화 테스트는 추가하지 않음(범위 밖 — requirements.md Out of Scope 참고)
