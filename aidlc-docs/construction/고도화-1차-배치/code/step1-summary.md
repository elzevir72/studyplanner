# Step 1 Summary — achievement drift 해소

## 변경 파일
- **Modified**: [frontend/src/achievement.ts](../../../../frontend/src/achievement.ts)

## 변경 내용
`calcEntryAchievementRate`에서, 목표는 있지만 그 수단의 기록이 없는 경우 0%를 평균에 포함하는 분기에 `goal.unit` 존재 가드를 추가해 `backend/domain/achievement.py:44-49`의 `if goal.get("unit") is not None:`와 동일하게 맞췄다.

## 근거
- [functional-design/business-logic-model.md](../functional-design/business-logic-model.md)
- [requirements.md](../../../inception/requirements/requirements.md) FR-1

## 테스트
프론트엔드 테스트 러너가 아직 없어 자동화 테스트는 생성하지 않음(Reverse Engineering 및 requirements.md Out of Scope에서 확인된 기존 제약 — 이번 배치 범위 밖). `goal.unit`이 항상 truthy인 현재 데이터 경로에서는 동작 변화가 없음을 로직상 확인.
