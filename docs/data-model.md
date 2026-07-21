# 데이터 모델 (DynamoDB)

데이터량이 매우 작은 규모(최대 10명 × 365일 ≈ 연 3,650건)이므로, 정교한 파티셔닝보다는 **조회 패턴이 단순한 구조**를 우선한다. 필드는 기획 초기 단계라 변경 가능성이 높음 — DynamoDB는 스키마리스이므로 필드 추가/삭제 시 마이그레이션이 필요 없다.

## 테이블: `Users`
고정된 사용자 풀 (최대 10명, 현재 실제 참가자는 5명 내외). 회원가입 없이 운영자가 미리 등록.

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` (PK) | string | 예: `u1` |
| `display_name` | string | 화면에 표시될 이름 |
| `pin_hash` | string | 4자리 PIN의 해시 (bcrypt) |
| `daily_goal` | map `{ value: number, unit: string }` \| null | 사용자가 스스로 설정하는 하루 학습 목표 (예: `{value: 120, unit: "분"}`). 언제든 본인이 수정 가능. 참가자별 가용 학습 시간 편차가 크고(직장인 등 상황이 제각각) 참여도 불규칙적이라 그룹 공통 목표를 두지 않음 — 미설정 시 null |
| `status` | string (`"active"` \| `"inactive"`) | 탈퇴(스터디 중단) 시 `inactive`로 전환. 삭제하지 않고 데이터는 그대로 보존. 기본값 `active` |
| `created_at` | string (ISO8601) | |

## 테이블: `Seasons`
스터디 시즌(예: 특정 회차 JLPT 대비 기간) 단위 구분. 같은 그룹이 여러 시즌을 이어서 진행할 수 있음(예: 같은 급수를 다음 회차에 재도전해 고득점 노리기).

| 필드 | 타입 | 설명 |
|---|---|---|
| `season_id` (PK) | string | 예: `2026-12-n2` |
| `name` | string | 표시용 이름 (예: `"2026년 12월 JLPT N2 대비"`) |
| `start_date` / `end_date` | string (`YYYY-MM-DD`) | 시즌 기간. `start_date`가 해당 시즌의 격주 집계 anchor로도 쓰임 |
| `target_level` | string \| null | 목표 급수 등 자유 기술 (선택) |
| `is_current` | boolean | 현재 진행 중인 시즌 여부(동시에 하나만 true) — 새로 작성되는 기록은 자동으로 이 시즌에 태깅됨 |

여러 그룹(예: 다른 어학/자격증 스터디)이 생기는 경우는 이 테이블에 `group_id`를 추가하는 멀티테넌트 방식이 아니라, **동일 코드베이스를 그룹별로 별도 배포**(별도 DynamoDB 테이블 세트, 별도 스택)하는 방식으로 대응한다 — `infra/CLAUDE.md`의 스테이지 분리 메커니즘을 그대로 재사용. 그룹 간 데이터가 완전히 분리되어 운영 관리가 단순하고, 서버리스라 그룹 하나 추가 배포해도 비용이 거의 늘지 않음.

## 테이블: `Entries`
day-by-day 학습 이력 본체.

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` (PK) | string | |
| `date` (SK) | string (`YYYY-MM-DD`) | |
| `study_method` | list\<string\> | 학습 수단 태그. 자유 입력 + 자동완성 프리셋 (JLPT 그룹 예시: `인강`/`문제집`/`단어암기`/`모의고사`) |
| `study_topic` | list\<string\> | 학습 내용 태그 (JLPT 그룹 예시: `문법`/`어휘`/`한자`/`청해`/`독해`) |
| `amount` | map `{ value: number, unit: string }` | 학습량 (예: `{value: 120, unit: "분"}`). unit은 자유 문자열 — **사람/기록마다 다르므로 그룹 합산 집계에 쓰지 않음** |
| `goal_snapshot` | map `{ value: number, unit: string }` \| null | 이 기록을 작성/수정한 시점의 `Users.daily_goal` 스냅샷. 이후 사용자가 목표를 바꿔도 과거 기록의 달성률은 이 값 기준으로 고정되어 소급 변경되지 않음 |
| `season_id` | string | 작성 시점의 현재 시즌(`Seasons.season_id`). 자동 태깅 — 사용자가 직접 선택하지 않음 |
| `notes` | string | 자유 기술 (오답노트/메모, 마크다운 허용). 그룹 공유 피드 및 **격주 모임 사전 공유 자료**로 사용 |
| `created_at` / `updated_at` | string (ISO8601) | |

### 달성률(achievement rate) 계산
- 별도로 저장하지 않고 **읽기 시점에 `amount`와 `goal_snapshot`으로부터 계산**하는 파생값(순수 함수).
- `amount.unit === goal_snapshot.unit`일 때만 계산: `round(amount.value / goal_snapshot.value * 100)`.
- 단위가 다르거나 `goal_snapshot`이 없으면(목표 미설정 시점의 기록) 달성률 없음(`null`) — UI에서는 "목표 미설정"으로 표기.
- 기존에 있던 `goal_achieved: boolean` 필드는 이 방식으로 대체되어 더 이상 사용하지 않음.

### GSI: `ByDate`
- **PK**: `"ENTRY"` (상수) — 데이터량이 작아 단일 논리 파티션으로도 충분
- **SK**: `date`
- 용도: 특정 기간(주/격주/월) 내 **전체 사용자**의 기록을 한 번의 Query(SK BETWEEN)로 조회 → 대시보드 집계 및 미수행자 판정에 사용

## 테이블: `Config`
그룹 설정값을 담는 단일 아이템 (설정 화면 없이 초기 배포 시 값 지정, 필요 시 관리자가 직접 수정).

| 필드 | 타입 | 설명 |
|---|---|---|
| `config_id` (PK) | string | 고정값 `"GROUP"` |
| `week_start_day` | string | 고정값 `"MON"` (ISO 8601) |

격주 집계 기준일은 더 이상 `Config`에 고정하지 않고 **현재 시즌(`Seasons.is_current=true`)의 `start_date`**를 anchor로 사용한다 — 시즌이 바뀌면 격주 주기도 새 시즌 시작일 기준으로 자연스럽게 재설정됨. **실제 격주 오프라인 모임 주기와 일치** — 대시보드의 기본/우선 뷰로 취급.

## 주요 접근 패턴
| 요청 | 방법 |
|---|---|
| 특정 유저의 특정 기간 기록 조회 | `Entries` 테이블 Query (PK=user_id, SK BETWEEN from/to) |
| 특정 주/월 전체 유저 기록 조회 (대시보드) | `ByDate` GSI Query (PK="ENTRY", SK BETWEEN from/to) 후 user_id별 group-by, **`status="active"`인 유저만 포함** |
| 미수행자 판정 | 위 결과에서 해당 기간 내 기록이 0건인 `user_id` 추출 (`status="active"`인 Users만 대상으로 diff) |
| 공유 피드 (notes 목록) | `ByDate` GSI Query 결과에서 `notes` 비어있지 않은 항목만 최신순 정렬 |
| 개인 달성률 조회 | 기간 내 각 `Entries` 항목의 `amount`/`goal_snapshot`으로 달성률 계산 후 추이 표시 (그룹 합산 아님) |
| 시즌 전체 통계 조회 | `Entries`에서 `season_id` 일치하는 항목 전체 집계 (참가자별 기록 수, 개인 달성률 추이) |
