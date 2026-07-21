# 데이터 모델 (DynamoDB)

데이터량이 매우 작은 규모(최대 10명 × 365일 ≈ 연 3,650건)이므로, 정교한 파티셔닝보다는 **조회 패턴이 단순한 구조**를 우선한다. 필드는 기획 초기 단계라 변경 가능성이 높음 — DynamoDB는 스키마리스이므로 필드 추가/삭제 시 마이그레이션이 필요 없다.

## 테이블: `Users`
고정된 사용자 풀 (최대 10명). 회원가입 없이 운영자가 미리 등록.

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` (PK) | string | 예: `u1` |
| `display_name` | string | 화면에 표시될 이름 |
| `pin_hash` | string | 4자리 PIN의 해시 (bcrypt) |
| `created_at` | string (ISO8601) | |

## 테이블: `Entries`
day-by-day 학습 이력 본체.

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` (PK) | string | |
| `date` (SK) | string (`YYYY-MM-DD`) | |
| `study_method` | list\<string\> | 학습 수단 태그 (예: `["인강", "문제집"]`), 자유 입력 + 자동완성 프리셋 |
| `study_topic` | list\<string\> | 학습 내용 태그 (예: `["문법", "어휘"]`) |
| `amount` | map `{ value: number, unit: string }` | 학습량 (예: `{value: 50, unit: "단어"}`). unit은 자유 문자열 — **사람/기록마다 다르므로 그룹 합산 집계에 쓰지 않음** |
| `goal_achieved` | boolean \| null | 그날 목표 달성 여부. 목표를 안 세웠으면 `null` |
| `notes` | string | 자유 기술 (오답노트/메모, 마크다운 허용). 그룹 공유 피드에 노출되는 핵심 필드 |
| `created_at` / `updated_at` | string (ISO8601) | |

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
| `biweekly_anchor_date` | string (`YYYY-MM-DD`) | 격주 집계 기준일 (그룹 시작일) |

## 주요 접근 패턴
| 요청 | 방법 |
|---|---|
| 특정 유저의 특정 기간 기록 조회 | `Entries` 테이블 Query (PK=user_id, SK BETWEEN from/to) |
| 특정 주/월 전체 유저 기록 조회 (대시보드) | `ByDate` GSI Query (PK="ENTRY", SK BETWEEN from/to) 후 user_id별 group-by |
| 미수행자 판정 | 위 결과에서 해당 기간 내 기록이 0건인 `user_id` 추출 (Users 테이블과 diff) |
| 공유 피드 (notes 목록) | `ByDate` GSI Query 결과에서 `notes` 비어있지 않은 항목만 최신순 정렬 |
