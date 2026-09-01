# Business Logic Model — 고도화 1차 배치

이번 unit은 신규 비즈니스 로직을 도입하지 않는다. 유일하게 로직이 변경되는 곳은 FR-1(achievement drift 해소)이며, 이는 **기존 Python 로직을 TypeScript에 정확히 이식**하는 것뿐이다.

## FR-1: achievement 달성률 계산 로직 (TS 이식)

### 현재 (버그 있는) 로직 — `frontend/src/achievement.ts`
```ts
for (const goal of goalSnapshot) {
  const amount = amountByMethod.get(goal.method) ?? null
  if (!amount) {
    rates.push(0)   // ← unit 존재 여부와 무관하게 항상 0 추가
    continue
  }
  ...
}
```

### 변경 후 — Python(`backend/domain/achievement.py:44-49`)과 동일하게
```ts
for (const goal of goalSnapshot) {
  const amount = amountByMethod.get(goal.method) ?? null
  if (!amount) {
    if (goal.unit) {  // Python의 `if goal.get("unit") is not None:`과 동일 취급
      rates.push(0)
    }
    continue
  }
  ...
}
```

### 로직 설명 (변경 없음, 이미 올바르게 문서화되어 있음 — 재확인 목적)
- 목표(`goalSnapshot`)의 각 수단에 대해, 그날 기록(`studyItems`)에 해당 수단이 없으면:
  - 목표에 `unit`이 설정되어 있으면 → 0%로 평균에 포함 ("목표를 안 채운 것"으로 취급)
  - 목표에 `unit`이 없으면(이론상 발생하지 않음, 방어적 가드) → 평균에서 제외
- 수단은 있지만 단위(`unit`)가 목표와 다르면 → 비교 불가로 평균에서 제외
- 계산 가능한 수단이 하나도 없으면 → `null` ("달성률 계산 불가")

### 영향 범위
- `frontend/src/achievement.ts`의 `calcEntryAchievementRate` 함수 내부 조건문 하나만 변경.
- 호출부(`EntryPage.tsx`)는 변경 없음 — 함수 시그니처(`(studyItems, goalSnapshot) => number | null`) 그대로 유지.
- 백엔드(`backend/domain/achievement.py`)는 변경하지 않음 — 이미 올바름.

## FR-3: 관리자 전체 목록 조회 (신규 로직 없음)

`admin_handler.list_all_users`는 조건 분기나 계산 로직이 없는 순수 "인가 → 조회 → 응답" 파이프라인이다. 상세 필드는 [domain-entities.md](domain-entities.md) 참고.
