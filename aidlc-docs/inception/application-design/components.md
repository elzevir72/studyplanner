# Components

[requirements.md](../requirements/requirements.md) FR-2(프론트 공용 컴포넌트)와 FR-3(관리자 신규 엔드포인트)에 대한 컴포넌트 정의. 결정 근거는 [application-design-plan.md](../plans/application-design-plan.md)의 Q-A~Q-G 답변 참고 (전 항목 A로 확정).

## Frontend Components (신규, `frontend/src/components/`)

파일 하나당 컴포넌트 하나 관례(기존 `DdayBanner.tsx`와 동일, Q-A=A) 유지.

### Button
- **Purpose**: 클릭 액션을 수행하는 범용 버튼. primary(기본 강조)/secondary(보조) 2종만 담당 (Q-C=A — 탭·태그는 별도 컴포넌트).
- **Responsibilities**: 폼 제출, 저장/취소/삭제 등 단발성 액션 버튼의 시각 스타일과 disabled/loading 상태를 통일.
- **Interface**: 기존 `<button>`/`<button className="secondary">` 마크업을 대체.

### Card
- **Purpose**: 콘텐츠를 감싸는 박스형 컨테이너. 기존 `.card`, `.study-item-block` 등 여러 CSS 클래스로 흩어져 있던 "테두리+둥근 모서리+패딩" 패턴을 통합.
- **Responsibilities**: 내부 콘텐츠(children)를 감싸는 시각적 경계 제공. variant 없이 단일 스타일(디자인 톤 결정에 따라 세부 스타일만 재작성).

### FormField
- **Purpose**: `label` + 입력 요소(`input`/`select`/`textarea`) 조합을 통합.
- **Responsibilities**: 라벨-입력 연결(`htmlFor`/`id`), 일관된 여백/타이포 적용. 입력 요소 자체(input/select/textarea)는 children 또는 별도 prop으로 위임.

### TagSelect
- **Purpose**: 토글형 태그 버튼 그룹 — 학습 수단(단일 선택), 학습 내용(다중 선택), 모임 목록 등에서 재사용.
- **Responsibilities**: 프리셋 옵션을 pill 버튼으로 렌더링하고 선택 상태를 시각화. 단일/다중 선택 모드를 하나의 컴포넌트가 지원 (Q-F=A).

### Message
- **Purpose**: 에러/힌트/성공 메시지 표시 통합. 기존 `.error`, `.hint` 클래스 대체.
- **Responsibilities**: 메시지 종류(error/hint/success)에 따라 색상만 다르게, 마크업 구조는 통일.

### Accordion
- **Purpose**: 접이식 콘텐츠 컨테이너. 단순 접이식(EntryPage의 "다른 날짜 기록 보기" 등)과 모임 회차처럼 부모가 열림 상태를 알아야 하는 제어형 용도를 하나의 컴포넌트로 통합 (Q-B=A, 개발자 의견 채택 — React의 선택적 제어 prop 패턴).
- **Responsibilities**: `open` prop이 없으면 내부 상태(비제어)로, 있으면 부모가 전달한 상태(제어)로 동작. `<details>`의 네이티브 접근성(키보드 토글 등)은 유지.

### LoadingPlaceholder
- **Purpose**: "불러오는 중..." 등 로딩 상태 표시 통일. 텍스트 안내 수준 유지(스켈레톤 UI 도입 안 함, Q-G=A), 단 새 디자인 토큰(타이포/여백)은 적용.
- **Responsibilities**: 데이터 로딩 중임을 알리는 짧은 안내 텍스트를 일관된 스타일로 표시.

## Backend Components (신규/변경)

### `admin_handler.list_all_users` (신규)
- **Purpose**: FR-3 — 관리자가 참가자 상태 변경 폼에서 활성/비활성 전체 계정을 드롭다운으로 선택할 수 있도록 전체 목록을 제공.
- **Responsibilities**: `require_admin`으로 인가 검사 후 `users_repo.list_all_users()`를 호출해 `user_id`/`display_name`/`status`를 반환 (Q-E=A — `users_handler.py`가 아닌 `admin_handler.py`에 위치, 이 파일의 "전부 admin 전용" 불변식 유지).
- **Type**: Lambda 핸들러 함수, `backend/handlers/admin_handler.py`에 추가.

### `users_repo.list_all_users` (기존, 재사용)
- 이미 구현되어 있음(`backend/repos/users_repo.py:24`) — 신규 구현 불필요, `admin_handler.list_all_users`에서 그대로 호출.

## 변경되지 않는 것 (명시)

- 라우팅(`App.tsx`) — 그대로 유지
- 전역 상태관리 방식(React 기본 state) — 그대로 유지
- `Tabs`(뷰 전환 버튼)는 이번 컴포넌트화 대상에서 제외 (Q-C=A로 Button과 분리 결정했으나, 별도 `Tabs` 컴포넌트 신설 여부는 이번 배치의 필수 산출물이 아님 — CSS 재작성 시 기존 `.view-tabs` 클래스 유지하며 톤만 재정비. 필요성이 확인되면 Functional Design 단계에서 추가 가능)
