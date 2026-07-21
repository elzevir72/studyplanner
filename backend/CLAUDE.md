# Backend — 가이드

Python으로 작성되는 Lambda 핸들러. API 계약은 [../docs/api.md](../docs/api.md), 데이터 스키마는 [../docs/data-model.md](../docs/data-model.md) 참고.

## 원칙
- 핸들러 하나당 하나의 책임(엔드포인트)만 갖도록 작게 유지 — Lambda 콜드스타트와 harness 유지보수 둘 다에 유리.
- DynamoDB 접근 로직은 핸들러와 분리해 재사용 가능한 모듈로 둔다 (예: `entries_repo.py`, `dashboard_repo.py`).
- 집계 로직(주간/월간/미수행자 판정)은 순수 함수로 작성해 유닛 테스트 가능하게 한다 — 날짜 range 계산, KST 타임존 처리가 버그 나기 쉬운 지점.
- 쓰기 엔드포인트(PUT/DELETE `/entries/*`)는 반드시 토큰의 `user_id`와 경로 파라미터 일치 여부를 검사한다.
- `amount.unit`이 사용자마다 다를 수 있음을 전제로, 그룹 합산 집계 함수를 만들지 않는다 (개인별 집계만).

## 아직 없는 것
코드 스캐폴딩 전 단계. 구현 시작 시 `requirements.txt`, `handlers/`, `repos/`, `tests/` 구조로 시작 예정.
