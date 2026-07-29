# Backend — 가이드

Python으로 작성되는 Lambda 핸들러. API 계약은 [../docs/api.md](../docs/api.md), 데이터 스키마는 [../docs/data-model.md](../docs/data-model.md) 참고.

## 원칙
- 핸들러 하나당 하나의 책임(엔드포인트)만 갖도록 작게 유지 — Lambda 콜드스타트와 harness 유지보수 둘 다에 유리.
- DynamoDB 접근 로직은 핸들러와 분리해 재사용 가능한 모듈로 둔다 (예: `entries_repo.py`, `dashboard_repo.py`).
- 집계 로직(주간/월간/미수행자 판정)은 순수 함수로 작성해 유닛 테스트 가능하게 한다 — 날짜 range 계산, KST 타임존 처리가 버그 나기 쉬운 지점.
- 쓰기 엔드포인트(PUT/DELETE `/entries/*`)는 반드시 토큰의 `user_id`와 경로 파라미터 일치 여부를 검사한다.
- `amount.unit`이 사용자마다, 그리고 같은 기록 안에서도 수단(method)마다 다를 수 있음을 전제로, 그룹 합산 집계 함수를 만들지 않는다 (개인별 집계만).
- 하루 기록은 `study_items`(수단별 항목 리스트)로 저장한다 — 수단마다 학습 내용(topics)과 학습량(amount)이 다를 수 있어서(예: 인강 30분 vs 문제집 5페이지) 단일 필드로 뭉치지 않는다. 목표(`daily_goal`)도 동일하게 수단별 리스트(`[{method, value, unit}]`)로 관리한다.
- 엔트리 저장(`PUT /entries/*`) 시 해당 유저의 현재 `Users.daily_goal`(수단별 목표 리스트)을 `Entries.goal_snapshot`으로 통째로 복사해 저장한다 — 목표 변경이 과거 기록에 소급 영향을 주지 않도록 하기 위함.
- 달성률(%) 계산은 `study_items`/`goal_snapshot`을 입력으로 받는 순수 함수(`calc_entry_achievement_rate`)로 작성한다: 목표의 각 수단에 대해 그날 기록된 amount로 비율을 구하고(단위 불일치 시 그 수단은 제외, 기록 자체가 없으면 0%로 포함) 평균을 낸다. 계산 가능한 수단이 하나도 없으면 null.
- 엔트리 저장 시 현재 시즌(`Seasons.is_current=true`)의 `season_id`를 자동으로 `Entries.season_id`에 채운다 — 클라이언트가 시즌을 보내지 않는다.
- 유저 목록/대시보드/미수행자 판정 등 모든 집계 로직은 `Users.status="active"`인 유저만 대상으로 한다. `inactive` 유저의 과거 `Entries`는 삭제하지 않고 그대로 조회 가능하게 남겨둔다.
- 대시보드 응답의 참가자별 `achievement_rate`는 기간 내 계산 가능한(단위 일치) 일별 달성률의 평균을 구하는 순수 함수로 작성한다. 그룹 전체를 합산하는 함수는 만들지 않는다(참가자별 개별 수치).
- D-day(`exam_date` - 오늘, KST 기준)도 순수 함수로 계산한다.
- `/admin/*` 엔드포인트는 참가자 토큰과 분리된 별도 인증 미들웨어로 검증한다 — 참가자 토큰으로 관리자 엔드포인트 호출이 불가능해야 하고 그 반대도 마찬가지.
- 시즌 활성화(`PATCH /admin/seasons/{id}/activate`)는 "기존 `is_current=true` 항목을 false로, 신규 항목을 true로" 두 쓰기를 `TransactWriteItems`로 묶어 원자적으로 처리한다 — 동시에 두 시즌이 `is_current=true`가 되는 상태를 방지하기 위함.
- 오프라인 모임 회차는 고정 간격(격주 등)으로 계산하지 않는다. 참가자가(관리자 권한 불필요) `Meetings`에 실제 모임 날짜를 등록하면, `backend/domain/periods.py`의 `meeting_rounds`(순수 함수)가 날짜순 정렬 후 회차 번호와 구간(from~to)을 읽기 시점에 계산한다 — 회차 번호 자체는 저장하지 않는다. 이 함수는 순수 함수라 오늘 날짜를 모르므로, 아직 지나지 않은(미래) 모임을 걸러내는 건 호출자(`dashboard_handler.meeting_rounds_dashboard`)의 책임이다 — 넘기기 전에 반드시 지난 모임만 필터링한다.
- 모임 등록/수정(`POST/PUT /meetings*`)은 `require_participant`만 검사하고 `require_participant_self`는 쓰지 않는다 — 시즌/계정 관리와 달리 모임 일정은 로그인한 참가자 누구나 조율할 수 있어야 하므로, 토큰의 `user_id`와 무관하게 허용한다. 단, **삭제**(`DELETE /meetings/{id}`)는 예외로 해당 모임의 `created_by`와 토큰의 `user_id`가 일치할 때만 허용한다 — 다른 사람이 등록한 모임을 실수로/의도적으로 지우는 사고를 막기 위함.

## 구현 현황 (2026-07-27 기준)
스캐폴딩 완료 — `requirements.txt`(boto3/PyJWT/bcrypt), `common/`(auth·db·errors·request·responses·time_utils), `domain/`(achievement·dashboard·dday·periods, 순수 함수), `handlers/`(auth·admin·users·entries·seasons·dashboard), `repos/`(admin·users·entries·seasons·meetings), `tests/`(domain 로직 유닛테스트), `scripts/seed_admin.py` 모두 존재. GitHub Actions로 AWS Lambda에 배포되어 실사용 검증 단계.

## 아직 없는 것 / 알아둘 것
- `repos/` 계층에 대한 유닛테스트는 없음(DynamoDB 접근이라 통합테스트 성격 — 현재 미작성).
- Lambda 배포 시 의존성(`bcrypt` 등 C 확장 포함 패키지)은 리포 루트에 `--platform manylinux2014_x86_64 --only-binary=:all:`로 설치해야 한다 — 자세한 배경은 [../infra/CLAUDE.md](../infra/CLAUDE.md) 참고.
