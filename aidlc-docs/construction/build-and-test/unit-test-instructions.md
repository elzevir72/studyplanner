# Unit Test Execution

프론트엔드는 테스트 러너가 설치되어 있지 않음(Reverse Engineering에서 확인된 기존 상태, 이번 배치 범위 밖 — requirements.md Out of Scope 참고). 유닛 테스트는 백엔드 `backend/domain/` 순수 함수 계층에만 존재.

## Run Unit Tests

### 1. Execute All Unit Tests
```bash
python -m pytest backend/tests -v
```

### 2. Review Test Results
- **Expected**: 21개 테스트 전부 통과, 0 실패
- **Test Coverage**: 커버리지 측정 도구(`pytest-cov` 등) 미설치 — 구조적으로 `backend/domain/*.py`(achievement/dashboard/dday/periods) 4개 모듈만 커버, `backend/handlers/`·`backend/repos/`는 커버리지 0%(기존 상태, 이번 배치로 변경 없음)
- **Test Report Location**: 터미널 출력만(리포트 파일 생성 설정 없음)

## 실제 실행 결과 (이번 배치, 2026-08-31)
```
collected 21 items

backend/tests/test_achievement.py .......... [ 52%]
backend/tests/test_dashboard.py ..           [ 61%]
backend/tests/test_dday.py ...               [ 76%]
backend/tests/test_periods.py .....          [100%]

21 passed in 0.10s
```
이번 배치는 백엔드 도메인 로직(`backend/domain/achievement.py`)을 변경하지 않았으므로(FR-1은 프론트 `achievement.ts`만 수정), 회귀 없이 21개 전부 그대로 통과.

### 3. Fix Failing Tests
현재 실패 없음. 향후 실패 시:
1. `python -m pytest backend/tests -v` 출력에서 실패한 테스트 케이스 확인
2. 해당 `backend/domain/*.py` 함수 또는 대응 테스트 파일 확인
3. 수정 후 재실행

## 신규 코드(admin_handler.list_all_users)에 대한 테스트 부재 — 의도적 결정
`backend/handlers/*.py` 전체가 원래부터 유닛 테스트 대상이 아니었고(핸들러 계층은 통합테스트 성격이라 미작성 — `backend/CLAUDE.md` 명시), 이번에 추가한 `list_all_users`도 같은 관례를 따라 테스트를 추가하지 않았다([step4-summary.md](../고도화-1차-배치/code/step4-summary.md) 참고). 이는 Reverse Engineering에서 지적된 기존 리스크(핸들러 계층 테스트 부재)를 그대로 유지하는 결정이며, 이번 배치 범위에서 해소 대상이 아니다.
