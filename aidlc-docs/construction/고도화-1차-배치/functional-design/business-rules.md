# Business Rules — 고도화 1차 배치

## FR-3: 관리자 전체 목록 조회 인가 규칙

| 규칙 | 설명 |
|---|---|
| 인가 주체 | `require_admin` — 관리자 토큰만 허용, 참가자 토큰으로는 호출 불가 (기존 `/admin/*` 엔드포인트와 동일 원칙, `backend/CLAUDE.md` 기준) |
| 노출 범위 | `active` + `inactive` 전체 참가자 — 기존 공개 `GET /users`(active만)와 달리 관리자만 비활성 계정까지 조회 가능 |
| 노출 필드 | `user_id`, `display_name`, `status`만 — `pin_hash` 등 민감 필드 제외 (기존 `admin_handler.create_user`의 필드 제외 관례 준수) |
| 데이터 소스 | `users_repo.list_all_users()` — 신규 쿼리 로직 없음, 기존 `Users` 테이블 전체 Scan |

## FR-1: achievement 계산 규칙 (변경 없음, 재확인)

| 규칙 | 설명 |
|---|---|
| 그룹 합산 금지 | 이번 변경도 개인 단위 계산 함수(`calcEntryAchievementRate`)만 수정 — 여러 참가자를 합산하는 로직은 추가하지 않음 (CLAUDE.md 원칙 준수) |
| 목표 소급 미반영 | `goalSnapshot`은 기록 시점에 저장된 스냅샷을 그대로 사용 — 이번 변경이 스냅샷 저장/조회 방식에 영향 없음 |

## FR-2: 컴포넌트 상호작용 규칙 (Functional Design 확정)

| 규칙 | 결정 | 근거 |
|---|---|---|
| TagSelect 단일 선택 재클릭 | 선택 해제(빈 값으로 전환) | Q-1=A, 사용자 명시적 결정 (페르소나 추천은 B였으나 사용자가 A로 확정) |
| Accordion 상호배타 소유권 | 부모 페이지(`DashboardPage.tsx`)가 `openRound` state로 관리, `Accordion` 자체는 상호배타를 모름 | Q-2=A, 기존 동작 보존 |
| 관리자 상태변경 드롭다운 초기값 | 선택한 참가자의 **현재 상태와 동일한 값**으로 초기화 | Q-3=B, "select는 서버 상태를 있는 그대로 반영해야 한다"는 원칙 채택 — 관리자가 실수로 제출만 눌러 의도치 않게 상태가 뒤집히는 위험을 배제 |
| Card 강조 스타일 | `variant?: 'default' \| 'highlight'` prop으로 명시적 지원 | Q-4=A |

### TagSelect 재클릭 해제 규칙 상세 (Q-1=A 반영)

- 단일 선택 모드에서 이미 선택된 옵션을 다시 클릭하면 선택값이 빈 문자열(`''`)로 돌아간다.
- 이는 `EntryPage.tsx`의 기존 동작(클릭 시 항상 값을 교체, 해제 개념 없음)과 **다른 동작**이므로, FR-2 구현 시 다음을 함께 처리해야 한다:
  - "학습 수단" 필드(`EntryPage.tsx`)에서 수단이 빈 값이 되면, `amountKindOf('')`가 `'free'`로 폴백되므로 `defaultAmountFor('')`도 `{value: 0, unit: ''}`로 초기화되어야 함(기존 `updateItem`의 "수단이 바뀌면 amount 리셋" 로직을 재클릭-해제 케이스에도 동일 적용).
  - 저장 시 검증(`validItems = studyItems.filter(item => item.method && item.amount.value > 0)`)은 기존 그대로 유지 — 수단이 빈 값인 항목은 저장 대상에서 자동 제외되므로 별도 에러 처리 불필요.
- "목표 설정" 폼의 수단 선택(`updateGoal`)에도 동일한 해제 동작이 적용된다(같은 `TagSelect` 컴포넌트 재사용).
