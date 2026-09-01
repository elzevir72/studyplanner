# API Documentation

Base path: `/api` via API Gateway HTTP API (payload v2). Verified directly against `serverless.yml` routes and the handler function bodies (not just `docs/api.md`). Discrepancies between `docs/api.md` and the real implementation are called out explicitly under each section.

## REST APIs

### 참가자 로그인
- **Method**: POST
- **Path**: `/api/auth/verify`
- **Purpose**: `{user_id, pin}` 검증, 성공 시 참가자 토큰(TTL 12시간) 발급.
- **Request**: `{"user_id": string, "pin": string}`
- **Response**: `200 {"token": string, "user_id": string, "display_name": string}` / `401` invalid.
- **Handler**: `backend/handlers/auth_handler.verify` — docs와 일치.

### 참가자 목록
- **Method**: GET
- **Path**: `/api/users`
- **Purpose**: 로그인 드롭다운용, `status="active"`만 반환.
- **Request**: 없음
- **Response**: `200 [{"user_id": string, "display_name": string}, ...]`
- **Handler**: `backend/handlers/users_handler.list_users` — docs와 일치. `users_repo.list_active_users()`가 실제로 `status="active"` 필터를 건다.

### PIN 변경
- **Method**: PUT
- **Path**: `/api/users/{user_id}/pin`
- **Purpose**: 본인 PIN 변경.
- **Request**: `{"current_pin": string, "new_pin": string}` (Bearer 토큰 필요, 본인만)
- **Response**: `200 {"status": "updated"}` / `401` 현재 PIN 불일치.
- **Handler**: `backend/handlers/users_handler.change_pin` — docs와 일치.

### 목표 조회
- **Method**: GET
- **Path**: `/api/users/{user_id}/goal`
- **Purpose**: 수단별 목표 리스트 조회. 인증 불필요(공유 목적).
- **Request**: 없음
- **Response**: `200` — `Users.daily_goal` 원본 반환. **목표가 설정되지 않은 경우 `200 null`을 반환한다** (`responses.ok(user.get("daily_goal"))`, `backend/handlers/users_handler.py:39`, `daily_goal`은 신규 유저 생성 시 `None`으로 초기화됨 — `backend/repos/users_repo.py:34`). `docs/api.md`는 이 null 케이스를 언급하지 않는다.
- **Handler**: `backend/handlers/users_handler.get_goal`.
- **Mismatch note**: 루트 CLAUDE.md 커밋 로그(`70d32cb`)는 "`responses.ok(None)`이 null 대신 `{}`를 반환하도록 고쳤다"고 주장하지만, 실제 diff는 그 반대로 **null-대체(`body if body is not None else {}`) 로직을 제거**해 원래의 `null` 동작으로 되돌렸다. 현재 코드는 확실히 `null`을 반환한다. 프론트(`frontend/src/api/client.ts:55`)는 이를 `MethodGoal[] | null`로 타입 선언하고 `EntryPage.tsx:91`에서 `g ?? []`로 안전하게 처리하므로 실제 렌더링 붕괴는 없지만, 커밋 메시지와 코드 동작이 불일치한다는 사실 자체가 기록 신뢰성 문제다.

### 목표 설정
- **Method**: PUT
- **Path**: `/api/users/{user_id}/goal`
- **Purpose**: 목표 리스트 전체 교체.
- **Request**: `{"goals": [{"method": string, "value": number, "unit": string}, ...]}` (본인만)
- **Response**: `200 [{method, value, unit}, ...]`
- **Handler**: `backend/handlers/users_handler.set_goal` — docs와 일치.

### 학습 기록 목록 조회
- **Method**: GET
- **Path**: `/api/entries/{user_id}?from=&to=`
- **Purpose**: 기간 내 기록 목록.
- **Request**: 쿼리 `from`, `to` (선택 — 둘 다 없으면 `entries_repo.list_entries_for_user`가 전체 기록을 반환. `docs/api.md`는 이 "생략 시 전체 조회" 동작을 명시하지 않음)
- **Response**: `200 [Entry, ...]`
- **Handler**: `backend/handlers/entries_handler.list_entries`
- **Mismatch note**: docs/api.md는 "본인만"으로 인증을 표기하지만 실제 코드는 `require_participant(event)`만 호출한다(`entries_handler.py:10`, 주석 "조회는 본인 여부와 무관하게 그룹 내 공유 목적으로 개방") — **다른 참가자의 `user_id`로도 로그인한 참가자면 누구나 조회 가능**하다. 이는 `docs/api.md`의 "다른 사람의 user_id로는 조회는 가능(공유 목적)하되"라는 별도 문구와는 실질적으로 일치하지만, 같은 문서의 표 안 "인증: 필요 (본인만)" 표기 자체는 오해를 일으키는 표현이다.

### 학습 기록 단건 조회
- **Method**: GET
- **Path**: `/api/entries/{user_id}/{date}`
- **Purpose**: 특정 날짜 기록 조회.
- **Handler**: `backend/handlers/entries_handler.get_entry` — 동일하게 `require_participant`만 사용(본인 여부 무관). docs 표기와 동일한 뉘앙스 이슈.
- **Response**: `200 Entry` / `404`.

### 학습 기록 저장(upsert)
- **Method**: PUT
- **Path**: `/api/entries/{user_id}/{date}`
- **Purpose**: 기록 생성/수정. `require_participant_self`로 본인 확인 — docs와 일치.
- **Request**: `{"study_items": [{method, topics, amount}, ...], "notes": string}` — `study_items`는 비어있지 않은 리스트, 각 항목은 `method`와 `amount` 필수(`entries_handler.py:35-39`). `topics`는 코드상 필수 검증이 없다(빈 배열/누락 허용).
- **Response**: `200 Entry` (서버가 `goal_snapshot`, `season_id`, `created_at`/`updated_at`을 자동 채움). 활성 시즌이 없으면 `400 "no active season configured"` — docs에는 이 에러 케이스가 문서화되어 있지 않음.
- **Handler**: `backend/handlers/entries_handler.put_entry`.

### 학습 기록 삭제
- **Method**: DELETE
- **Path**: `/api/entries/{user_id}/{date}`
- **Handler**: `backend/handlers/entries_handler.delete_entry` — `require_participant_self`, docs와 일치. `204 No Content`.

### 시즌 목록
- **Method**: GET, **Path**: `/api/seasons` — `backend/handlers/seasons_handler.list_seasons`, docs와 일치.

### 현재 시즌
- **Method**: GET, **Path**: `/api/seasons/current` — `backend/handlers/seasons_handler.current_season`. `200 {..., "d_day": number|null}` 또는 `404`. docs와 일치(`d_day` 필드는 `docs/data-model.md`의 `Season` 스키마에는 없지만 `docs/api.md`의 설명과는 부합).

### 시즌 대시보드
- **Method**: GET, **Path**: `/api/dashboard/season/{season_id}` — `backend/handlers/seasons_handler.season_dashboard`. `200 {"season": {...d_day}, "participants": [...]}`. docs와 일치.

### 주간 대시보드
- **Method**: GET, **Path**: `/api/dashboard/weekly?week=2026-W03` — `backend/handlers/dashboard_handler.weekly`. `week` 생략 시 오늘이 속한 ISO 주로 계산. 응답 키는 `week`/`range`/`participants`/`not_participated` — docs 예시와 일치.

### 월간 대시보드
- **Method**: GET, **Path**: `/api/dashboard/monthly?month=2026-07` — `backend/handlers/dashboard_handler.monthly`. docs와 일치.

### 공유 피드
- **Method**: GET, **Path**: `/api/dashboard/feed?from=&to=` — `backend/handlers/dashboard_handler.feed`. `from`/`to` 필수(없으면 400) — docs에 이 필수 여부가 명시되어 있지 않다.

### 모임 목록
- **Method**: GET, **Path**: `/api/meetings` — `backend/handlers/dashboard_handler.list_meetings` (파일명이 `dashboard_handler`이지만 실제로 모임 CRUD 전체를 담당 — docs/api.md는 "오프라인 모임"을 별도 섹션으로 다루지만 실제 소스는 대시보드 핸들러 파일 안에 있다). 인증 불필요, docs와 일치.

### 모임 등록
- **Method**: POST, **Path**: `/api/meetings` — `create_meeting`, `require_participant`만 사용(본인 확인 없음) — docs와 일치.

### 모임 수정
- **Method**: PUT, **Path**: `/api/meetings/{meeting_id}` — `update_meeting`, `require_participant`만 사용 — docs와 일치. `date` 필수, `memo` 선택(기본 빈 문자열).

### 모임 삭제
- **Method**: DELETE, **Path**: `/api/meetings/{meeting_id}` — `delete_meeting`. `require_participant`로 토큰만 확인한 뒤, 핸들러가 직접 `meeting.get("created_by") != user_id`를 비교해 403을 반환(`dashboard_handler.py:89-90`) — docs 설명과 일치. `require_participant_self`를 쓰지 않는 이유(모임 등록자와 삭제 요청자가 다른 개념)가 명확히 코드/주석에 반영되어 있음.

### 모임 회차별 대시보드
- **Method**: GET, **Path**: `/api/dashboard/meetings` — `meeting_rounds_dashboard`. 활성 시즌이 없으면 `400`(docs에 미문서화). 오늘(KST) 이후 모임은 `past_meetings` 필터링 단계에서 제외(`meeting["date"] <= today`) — docs와 일치. 응답 배열의 각 원소는 `_dashboard_response`가 만든 `{"round", "range", "participants", "not_participated"}`에 `meeting_id`/`memo`/`created_by`를 덧붙인 형태 — `docs/api.md`의 예시 응답은 `"range"` 대신 최상위에 `"range"` 키를 그대로 쓰고 있어 실제 필드 구조와 일치한다. 단, docs 예시에는 없는 `"not_participated"` 필드가 실제로는 포함된다(코드가 더 많은 정보를 제공).

### 관리자 로그인
- **Method**: POST, **Path**: `/api/admin/auth/verify` — `backend/handlers/admin_handler.verify`. docs와 일치.

### 참가자 계정 생성 (관리자)
- **Method**: POST, **Path**: `/api/admin/users` — `create_user`. `user_id` 중복 시 `400`(`ValueError`) — docs에 이 에러 케이스 미문서화. 응답에서 `pin_hash`를 제외하고 반환(`{k: v for k, v in user.items() if k != "pin_hash"}`) — 보안상 바람직한 처리.

### 참가자 상태 변경 (관리자)
- **Method**: PATCH, **Path**: `/api/admin/users/{user_id}` — `update_user_status`. `status`가 `active`/`inactive` 외 값이면 `400`. docs와 일치.

### 시즌 생성 (관리자)
- **Method**: POST, **Path**: `/api/admin/seasons` — `create_season`. docs와 일치. 생성 직후 `is_current`는 항상 `false`(활성화는 별도 API).

### 시즌 활성화 (관리자)
- **Method**: PATCH, **Path**: `/api/admin/seasons/{season_id}/activate` — `activate_season`. `TransactWriteItems`로 원자적 처리 — docs와 실제 구현(`seasons_repo.activate_season`) 일치.

## Internal APIs

### `backend.common.auth`
- **Methods**:
  - `hash_secret(raw: str) -> str`
  - `verify_secret(raw: str, hashed: str) -> bool`
  - `issue_participant_token(user_id: str) -> str`
  - `issue_admin_token() -> str`
  - `require_participant(event: dict) -> str` — returns user_id
  - `require_participant_self(event: dict, path_user_id: str) -> str`
  - `require_admin(event: dict) -> None`
- **Parameters/Return Types**: 위 시그니처 그대로. `AuthError(message, status=401)`를 던져 `handle_errors`가 401/403으로 변환.

### `backend.domain.achievement`
- **Methods**:
  - `calc_achievement_rate(amount: Optional[dict], goal: Optional[dict]) -> Optional[int]`
  - `calc_entry_achievement_rate(study_items: list[dict], goal_snapshot: Optional[list[dict]]) -> Optional[int]`
  - `average_achievement_rate(entries: list[dict]) -> Optional[int]`
- **Parameters**: `amount`/`goal`은 `{"value": number, "unit": str}`. `study_items`는 `{"method", "topics", "amount"}` 리스트.
- **Return Types**: `int`(0~) 또는 `None`(계산 불가).

### `backend.domain.periods`
- **Methods**: `week_range_from_iso(iso_week: str) -> tuple[date, date]`, `week_range_containing(reference_date: date) -> tuple[date, date]`, `meeting_rounds(meetings: list[dict], season_start: str) -> list[dict]`, `month_range_from_str(month_str: str) -> tuple[date, date]`, `month_range_containing(reference_date: date) -> tuple[date, date]`.

### `backend.domain.dday`
- **Methods**: `calc_dday(exam_date: Optional[str], today: date) -> Optional[int]`.

## Data Models

### Users
- **Fields**: `user_id`(PK), `display_name`, `pin_hash`, `daily_goal`(list|null), `status`("active"|"inactive"), `created_at`.
- **Relationships**: `Entries.user_id`, `Meetings.created_by`가 참조.
- **Validation**: 핸들러 레벨에서 `create_user`가 `user_id`/`display_name`/`pin`을 필수로 요구하고 중복 생성 방지. `daily_goal` 스키마 자체는 DB 레벨 검증 없음(스키마리스).

### Admin
- **Fields**: `admin_id`(PK, 고정값 `"ADMIN"`), `password_hash`.
- **Relationships**: 없음(단일 아이템, Users와 완전 분리).
- **Validation**: `seed_admin.py`가 비밀번호 8자 미만이면 종료(스크립트 레벨 검증, API 레벨 검증 아님 — API로 관리자 계정을 만드는 경로 자체가 없음).

### Seasons
- **Fields**: `season_id`(PK), `name`, `start_date`, `end_date`, `target_level`(nullable), `exam_date`(nullable), `is_current`(bool).
- **Relationships**: `Entries.season_id`가 참조.
- **Validation**: `create_season`이 `season_id`/`name`/`start_date`/`end_date` 필수. 동시에 두 시즌이 `is_current=true`가 되지 않도록 `activate_season`이 트랜잭션으로 보장.

### Entries
- **Fields**: `user_id`(PK), `date`(SK), `study_items`(list), `goal_snapshot`(list|null), `season_id`, `notes`, `created_at`/`updated_at`, `gsi_pk`(내부용, GSI 파티션 키 상수 `"ENTRY"` — `docs/data-model.md`에는 문서화되어 있지 않은 실제 저장 필드).
- **Relationships**: `user_id`→`Users`, `season_id`→`Seasons`.
- **Validation**: `put_entry` 핸들러가 `study_items` 비어있지 않음, 각 항목 `method`+`amount` 필수만 검증. `amount.unit`은 자유 문자열(검증 없음).

### Meetings
- **Fields**: `meeting_id`(PK, uuid4 hex), `date`, `memo`, `created_by`, `created_at`.
- **Relationships**: `created_by`→`Users.user_id`(약한 참조, FK 강제 없음).
- **Validation**: `create_meeting`/`update_meeting`이 `date` 필수만 검증.

### Config (미사용 — 상세 내용은 code-quality-assessment.md 참고)
- **Fields**: `config_id`(PK, 고정값 `"GROUP"`), `week_start_day`(문서상 고정값 `"MON"`).
- **Relationships**: 없음.
- **Validation**: 해당 없음 — 코드에서 이 테이블에 접근하는 로직이 전혀 없음(grep 결과 `backend/` 전체에서 `CONFIG_TABLE`/`Config`/`week_start_day` 참조 0건).
