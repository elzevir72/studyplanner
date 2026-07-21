# Backend — 가이드

Python으로 작성되는 Lambda 핸들러. API 계약은 [../docs/api.md](../docs/api.md), 데이터 스키마는 [../docs/data-model.md](../docs/data-model.md) 참고.

## 원칙
- 핸들러 하나당 하나의 책임(엔드포인트)만 갖도록 작게 유지 — Lambda 콜드스타트와 harness 유지보수 둘 다에 유리.
- DynamoDB 접근 로직은 핸들러와 분리해 재사용 가능한 모듈로 둔다 (예: `entries_repo.py`, `dashboard_repo.py`).
- 집계 로직(주간/월간/미수행자 판정)은 순수 함수로 작성해 유닛 테스트 가능하게 한다 — 날짜 range 계산, KST 타임존 처리가 버그 나기 쉬운 지점.
- 쓰기 엔드포인트(PUT/DELETE `/entries/*`)는 반드시 토큰의 `user_id`와 경로 파라미터 일치 여부를 검사한다.
- `amount.unit`이 사용자마다 다를 수 있음을 전제로, 그룹 합산 집계 함수를 만들지 않는다 (개인별 집계만).
- 엔트리 저장(`PUT /entries/*`) 시 해당 유저의 현재 `Users.daily_goal`을 `Entries.goal_snapshot`으로 복사해 저장한다 — 목표 변경이 과거 기록에 소급 영향을 주지 않도록 하기 위함.
- 달성률(%) 계산은 `amount`/`goal_snapshot`을 입력으로 받는 순수 함수로 작성하고, 두 값의 `unit`이 일치할 때만 계산한다 (다르면 null 반환).
- 엔트리 저장 시 현재 시즌(`Seasons.is_current=true`)의 `season_id`를 자동으로 `Entries.season_id`에 채운다 — 클라이언트가 시즌을 보내지 않는다.
- 유저 목록/대시보드/미수행자 판정 등 모든 집계 로직은 `Users.status="active"`인 유저만 대상으로 한다. `inactive` 유저의 과거 `Entries`는 삭제하지 않고 그대로 조회 가능하게 남겨둔다.
- 대시보드 응답의 참가자별 `achievement_rate`는 기간 내 계산 가능한(단위 일치) 일별 달성률의 평균을 구하는 순수 함수로 작성한다. 그룹 전체를 합산하는 함수는 만들지 않는다(참가자별 개별 수치).
- D-day(`exam_date` - 오늘, KST 기준)도 순수 함수로 계산한다.
- `/admin/*` 엔드포인트는 참가자 토큰과 분리된 별도 인증 미들웨어로 검증한다 — 참가자 토큰으로 관리자 엔드포인트 호출이 불가능해야 하고 그 반대도 마찬가지.
- 시즌 활성화(`PATCH /admin/seasons/{id}/activate`)는 "기존 `is_current=true` 항목을 false로, 신규 항목을 true로" 두 쓰기를 `TransactWriteItems`로 묶어 원자적으로 처리한다 — 동시에 두 시즌이 `is_current=true`가 되는 상태를 방지하기 위함.

## 아직 없는 것
코드 스캐폴딩 전 단계. 구현 시작 시 `requirements.txt`, `handlers/`, `repos/`, `tests/` 구조로 시작 예정.
