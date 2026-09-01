# Step 3 Summary — 디자인 톤 재작업 + 4개 페이지 컴포넌트 전환

## 변경 파일
- **Modified**: [frontend/src/styles.css](../../../../frontend/src/styles.css) — 전면 재작성. 기존 파스텔 스카이블루 팔레트는 유지, 여백 스케일(`--space-*` 토큰)을 도입해 카드/섹션 리듬 통일, `.narrow-shell`(기존 `.login-shell` 대체, 관리자 로그인에도 적용), `.card-highlight`, `.loading-placeholder`, `.brand` 등 신규 컴포넌트용 클래스 추가
- **Modified**: [frontend/src/pages/LoginPage.tsx](../../../../frontend/src/pages/LoginPage.tsx) — Button/FormField/Message 전환, 브랜드 마크(📘) 추가
- **Modified**: [frontend/src/pages/EntryPage.tsx](../../../../frontend/src/pages/EntryPage.tsx) — 전체 컴포넌트 전환, TagSelect 재클릭 해제에 따른 amount 리셋 로직 반영, 학습량 입력 렌더링을 `renderAmountFields` 헬퍼로 추출해 기록/목표 폼 중복 제거
- **Modified**: [frontend/src/pages/DashboardPage.tsx](../../../../frontend/src/pages/DashboardPage.tsx) — Button/FormField/Message/Accordion(제어형, `openRound` 상호배타)/LoadingPlaceholder 전환. "예정된 모임" 목록은 기존 `.feed-item` 클래스를 유지(Card로 바꾸면 CSS 셀렉터 불일치로 스타일 깨짐을 확인해 되돌림)
- **Modified**: [frontend/src/pages/AdminPage.tsx](../../../../frontend/src/pages/AdminPage.tsx) — Button/Card/FormField/Message 전환, 로그인 폼에 `.narrow-shell` 적용, 브랜드 마크(🛠️) 추가. `UpdateUserStatusForm`의 드롭다운 전환은 Step 4에서 처리(현재는 스타일만 전환, raw text input 유지)
- **Modified**: [frontend/index.html](../../../../frontend/index.html) — 파비콘(📘 이모지 data URI) 추가

## 근거
- [functional-design/frontend-components.md](../functional-design/frontend-components.md)
- [inception/requirements/requirements.md](../../../inception/requirements/requirements.md) FR-2

## 검증
- `npx tsc --noEmit` — 타입 에러 없음
- Vite dev 서버 — 컴파일 에러 없음
- 브라우저 렌더링 확인(로그인/관리자 로그인/개인 기록/대시보드 4개 화면) — 콘솔 에러는 백엔드 미기동으로 인한 네트워크 실패(`ERR_CONNECTION_REFUSED`, `Failed to fetch`)뿐, 컴포넌트 렌더링 크래시 없음. 이 unhandled rejection은 `DashboardPage.tsx`의 기존 `loadMeetingRounds`에 이미 있던 동작으로 이번 변경으로 인한 회귀 아님(사전 코드 대조로 확인)
- TagSelect 실제 클릭 테스트: 단일 선택 재클릭 시 해제(Q-1=A) 확인, 다중 선택 토글 정상 확인
- 수단 선택 시 학습량 입력 방식(시간/분수/고정단위/자유) 자동 전환 정상 확인
