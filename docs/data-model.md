# 데이터 모델 (DynamoDB)

데이터량이 매우 작은 규모(최대 10명 × 365일 ≈ 연 3,650건)이므로, 정교한 파티셔닝보다는 **조회 패턴이 단순한 구조**를 우선한다. 필드는 기획 초기 단계라 변경 가능성이 높음 — DynamoDB는 스키마리스이므로 필드 추가/삭제 시 마이그레이션이 필요 없다.

## 테이블: `Users`
고정된 사용자 풀 (최대 10명, 현재 실제 참가자는 5명 내외). 회원가입 없이 운영자가 미리 등록.

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` (PK) | string | 예: `u1` |
| `display_name` | string | 화면에 표시될 이름 |
| `pin_hash` | string | 4자리 PIN의 해시 (bcrypt) |
| `daily_goal` | list\<map `{ method: string, value: number, unit: string }`\> \| null | 사용자가 스스로 설정하는 하루 학습 목표. **수단(method)별로 여러 개 설정 가능** (예: `[{method:"인강", value:30, unit:"분"}, {method:"문제집", value:10, unit:"페이지"}]`) — 수단마다 학습 단위가 다를 수 있어서(시간 vs 분량) 목표도 수단별로 분리. 언제든 본인이 전체 리스트를 교체하는 방식으로 수정 가능. 참가자별 가용 학습 시간 편차가 크고(직장인 등 상황이 제각각) 참여도 불규칙적이라 그룹 공통 목표를 두지 않음 — 미설정 시 null |
| `status` | string (`"active"` \| `"inactive"`) | 탈퇴(스터디 중단) 시 `inactive`로 전환. 삭제하지 않고 데이터는 그대로 보존. 기본값 `active` |
| `created_at` | string (ISO8601) | |

## 테이블: `Admin`
스터디 참가자(`Users`)와 완전히 분리된 단일 관리자 계정. 참가자 계정 생성/상태 변경, 시즌 생성/전환을 담당하는 순수 관리 전용 계정 — 스터디에 직접 참여하지 않으며 참가자 드롭다운 등 일반 화면에는 절대 노출되지 않음.

| 필드 | 타입 | 설명 |
|---|---|---|
| `admin_id` (PK) | string | 고정값 `"ADMIN"` (단일 아이템) |
| `password_hash` | string | 관리자 비밀번호 해시 (bcrypt). 참가자 PIN(4자리)보다 긴 값 권장 — 계정 생성/시즌 전환 등 파급력이 크므로 |

## 테이블: `Seasons`
스터디 시즌(예: 특정 회차 JLPT 대비 기간) 단위 구분. 같은 그룹이 여러 시즌을 이어서 진행할 수 있음(예: 같은 급수를 다음 회차에 재도전해 고득점 노리기).

| 필드 | 타입 | 설명 |
|---|---|---|
| `season_id` (PK) | string | 예: `2026-12-n2` |
| `name` | string | 표시용 이름 (예: `"2026년 12월 JLPT N2 대비"`) |
| `start_date` / `end_date` | string (`YYYY-MM-DD`) | 시즌 기간. `start_date`가 해당 시즌의 격주 집계 anchor로도 쓰임 |
| `target_level` | string \| null | 목표 급수 등 자유 기술 (선택) |
| `exam_date` | string (`YYYY-MM-DD`) \| null | 시험일. 대시보드/개인 화면 상단에 "OO 시험까지 OO일 남았습니다" 배너로 표시(능동 알림 아님, 접속 시에만 노출) |
| `is_current` | boolean | 현재 진행 중인 시즌 여부(동시에 하나만 true) — 새로 작성되는 기록은 자동으로 이 시즌에 태깅됨. 관리자가 신규 시즌을 활성화하면 기존 시즌은 자동으로 false로 전환 |

여러 그룹(예: 다른 어학/자격증 스터디)이 생기는 경우는 이 테이블에 `group_id`를 추가하는 멀티테넌트 방식이 아니라, **동일 코드베이스를 그룹별로 별도 배포**(별도 DynamoDB 테이블 세트, 별도 스택)하는 방식으로 대응한다 — `infra/CLAUDE.md`의 스테이지 분리 메커니즘을 그대로 재사용. 그룹 간 데이터가 완전히 분리되어 운영 관리가 단순하고, 서버리스라 그룹 하나 추가 배포해도 비용이 거의 늘지 않음.

## 테이블: `Entries`
day-by-day 학습 이력 본체.

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` (PK) | string | |
| `date` (SK) | string (`YYYY-MM-DD`) | |
| `study_items` | list\<map `{ method: string, topics: list\<string\>, amount: {value: number, unit: string} }`\> | 하루의 학습 내역. **수단(method)마다 별도 항목**으로 나뉘며, 각 항목이 자기만의 학습 내용(topics)과 학습량(amount)을 가진다 — 예: `[{method:"인강", topics:["문법","청해"], amount:{value:30, unit:"분"}}, {method:"문제집", topics:["어휘"], amount:{value:5, unit:"페이지"}}]`. method는 자유 입력 + 프리셋(JLPT 그룹 예시: `인강`/`문제집`/`단어암기`/`모의고사`), topics도 프리셋(`문법`/`어휘`/`한자`/`청해`/`독해`) + 자유 입력. amount의 unit은 자유 문자열 — **사람/기록/수단마다 다르므로 그룹 합산 집계에 쓰지 않음** |
| `goal_snapshot` | list\<map `{ method: string, value: number, unit: string }`\> \| null | 이 기록을 작성/수정한 시점의 `Users.daily_goal` 스냅샷(수단별 목표 리스트 그대로). 이후 사용자가 목표를 바꿔도 과거 기록의 달성률은 이 값 기준으로 고정되어 소급 변경되지 않음 |
| `season_id` | string | 작성 시점의 현재 시즌(`Seasons.season_id`). 자동 태깅 — 사용자가 직접 선택하지 않음 |
| `notes` | string | 자유 기술 (오답노트/메모, 마크다운 허용). 수단별이 아니라 그날 기록 전체에 하나. 그룹 공유 피드 및 **격주 모임 사전 공유 자료**로 사용 |
| `created_at` / `updated_at` | string (ISO8601) | |

### 달성률(achievement rate) 계산
- 별도로 저장하지 않고 **읽기 시점에 `study_items`와 `goal_snapshot`으로부터 계산**하는 파생값(순수 함수).
- `goal_snapshot`의 각 수단(method)에 대해: 그날 `study_items`에 같은 method가 있으면 `round(amount.value / goal.value * 100)`, unit이 다르면 그 수단은 비교 불가로 평균에서 제외, **그 method로 아예 기록을 안 했으면 0%로 평균에 포함**(목표를 안 채운 것도 반영되어야 하므로).
- 위에서 구한 수단별 비율들의 평균이 그날의 달성률. 계산 가능한 수단이 하나도 없으면(목표 자체가 없거나 전부 단위 불일치) `null` — UI에서는 "목표 미설정"으로 표기.
- 예: 목표가 `인강 30분`, `문제집 10페이지`이고 오늘 인강 6분만 기록했다면 → 인강 20%, 문제집 0% → 평균 10%.
- 기존에 있던 `goal_achieved: boolean` 필드는 이 방식으로 대체되어 더 이상 사용하지 않음.

### GSI: `ByDate`
- **PK**: `"ENTRY"` (상수) — 데이터량이 작아 단일 논리 파티션으로도 충분
- **SK**: `date`
- 용도: 특정 기간(주/격주/월) 내 **전체 사용자**의 기록을 한 번의 Query(SK BETWEEN)로 조회 → 대시보드 집계 및 미수행자 판정에 사용

## 테이블: `Meetings`
실제로 열린(또는 예정된) 오프라인 모임 날짜. 등록/수정은 참가자 누구나(관리자 권한 불필요) 가능하지만, **삭제는 등록한 본인만** 가능 — 다른 참가자가 실수로/의도적으로 남의 모임을 지우는 사고를 막기 위함. 격주처럼 고정 간격을 가정하지 않고, 실제 모임이 열린 날짜를 그대로 회차 anchor로 쓴다(모임이 매번 정확히 2주 간격이 아닐 수 있어서).

| 필드 | 타입 | 설명 |
|---|---|---|
| `meeting_id` (PK) | string | UUID |
| `date` | string (`YYYY-MM-DD`) | 모임이 열린(열릴) 날짜 |
| `memo` | string | 그 모임에서 다룬 내용에 대한 한 줄 메모/주제 (예: "N2 문법 총정리") |
| `created_by` | string | 등록한 참가자의 `user_id`. 삭제 권한 판정에만 쓰이고 화면에 노출하지 않음 |
| `created_at` | string (ISO8601) | |

회차 번호는 저장하지 않고, 등록된 모임들을 날짜순 정렬해 **읽기 시점에 계산**한다(순수 함수, `backend/domain/periods.py`의 `meeting_rounds`). 각 회차의 집계 구간은 "직전 회차 모임 다음날 ~ 이번 회차 모임 날짜"(1회차는 현재 시즌 `start_date`부터).

**아직 지나지 않은(오늘 이후) 모임은 회차 집계에서 제외한다** — 아직 열리지도 않은 모임을 이미 끝난 회차처럼 집계해서 보여주면 안 되기 때문. 그런 모임은 대시보드의 "오프라인 모임" 탭에 "예정된 모임"으로 날짜/메모만 별도 표시되고, 참가자별 달성률 등 집계는 붙지 않는다. 회차 집계 대상(지난 모임) 필터링은 `/dashboard/meetings` 핸들러가 오늘 날짜(KST) 기준으로 수행한다.

## 주요 접근 패턴
| 요청 | 방법 |
|---|---|
| 특정 유저의 특정 기간 기록 조회 | `Entries` 테이블 Query (PK=user_id, SK BETWEEN from/to) |
| 특정 주/월 전체 유저 기록 조회 (대시보드) | `ByDate` GSI Query (PK="ENTRY", SK BETWEEN from/to) 후 user_id별 group-by, **`status="active"`인 유저만 포함** |
| 오프라인 모임 회차별 조회 | `Meetings` 전체 스캔 → 날짜순 정렬해 회차/구간 계산 → 각 구간을 `ByDate` GSI로 조회해 참가자별 집계 |
| 미수행자 판정 | 위 결과에서 해당 기간 내 기록이 0건인 `user_id` 추출 (`status="active"`인 Users만 대상으로 diff) |
| 공유 피드 (notes 목록) | `ByDate` GSI Query 결과에서 `notes` 비어있지 않은 항목만 최신순 정렬 |
| 개인 달성률 조회 | 기간 내 각 `Entries` 항목의 `amount`/`goal_snapshot`으로 달성률 계산 후 추이 표시 (그룹 합산 아님) |
| 대시보드 참가자별 달성률 | 기간 내 각 참가자의 계산 가능한(단위 일치) 일별 달성률 평균 — 계산 가능한 기록이 없으면 null. 그룹 평균(전체 합산)이 아니라 참가자별 개별 수치 |
| 시즌 전체 통계 조회 | `Entries`에서 `season_id` 일치하는 항목 전체 집계 (참가자별 기록 수, 개인 달성률 추이) |
| 시험일 D-day 계산 | 현재 시즌(`Seasons.is_current=true`)의 `exam_date` - 오늘(KST) |
