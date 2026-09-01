# Application Design Plan

이 프로젝트는 brownfield이며 이미 아키텍처(핸들러/리포/도메인 계층, React 4페이지 구조)가 확립돼 있습니다. 이번 Application Design은 신규 설계가 아니라, [requirements.md](../requirements/requirements.md)의 5개 FR을 **기존 구조에 어떻게 편입시킬지** 결정하는 작업입니다.

## 1. Analyze Context — 요약

- FR-1 (drift 해소): 프론트 전용, 신규 컴포넌트 없음
- FR-2 (디자인+아키텍처 재작업): 신규 프론트 컴포넌트 7종(Button/Card/FormField/TagSelect/Message/Accordion/LoadingPlaceholder), 4개 페이지 전환
- FR-3 (관리자 드롭다운): 신규 백엔드 엔드포인트 1개(`GET /admin/users`) + 프론트 변경
- FR-4 (문서 정정): 코드 변경 없음, 컴포넌트 설계 대상 아님
- FR-5 (Config 테이블 제거): 인프라 변경, 코드 컴포넌트 설계 대상 아님

→ 컴포넌트 설계가 실질적으로 필요한 건 FR-2(프론트 공용 컴포넌트)와 FR-3(백엔드 신규 엔드포인트 1개)입니다. FR-1/4/5는 기존 컴포넌트의 내부 수정이거나 컴포넌트 경계와 무관한 변경이라 이 산출물에서는 가볍게만 다룹니다.

## 2. Design Plan

- [ ] `components.md` — 신규 프론트 공용 컴포넌트 7종 + 신규/변경되는 백엔드 컴포넌트(엔드포인트) 정의
- [ ] `component-methods.md` — 각 컴포넌트의 props/함수 시그니처 (상세 비즈니스 로직 제외 — Functional Design에서 다룸)
- [ ] `services.md` — 오케스트레이션 관점: 프론트 API 클라이언트 계층(`api/client.ts`)에 추가되는 함수, 백엔드 핸들러의 조합 로직
- [ ] `component-dependency.md` — 페이지→공용 컴포넌트 의존 관계, 신규 엔드포인트의 인가/리포 의존 관계
- [ ] `application-design.md` — 위 4개를 통합한 최종 문서

## 3. Context-Appropriate Questions

### 3.1 Component Identification

**Q-A.** `frontend/src/components/`에 신규 컴포넌트를 추가할 때, 기존 `DdayBanner.tsx`처럼 파일 하나당 컴포넌트 하나로 유지할까요, 아니면 관련 있는 것끼리(예: `Form.tsx` 안에 `FormField` 등 여러 export) 묶을까요?

A) 파일 하나당 컴포넌트 하나 (기존 `DdayBanner.tsx` 관례 유지) — `Button.tsx`, `Card.tsx`, `FormField.tsx`, `TagSelect.tsx`, `Message.tsx`, `Accordion.tsx`, `LoadingPlaceholder.tsx` 7개 파일
B) 성격이 비슷한 것끼리 묶기 (예: `ui/Primitives.tsx`에 Button/Card/Message, `ui/Form.tsx`에 FormField/TagSelect, `ui/Accordion.tsx`, `ui/LoadingPlaceholder.tsx` — 4개 파일)

> 💡 **페르소나별 추천**
> - **PM**: **A**. 기존 리포에 이미 파일당 컴포넌트 하나 관례(`DdayBanner.tsx`)가 서 있는데 새 규칙을 도입하면, 다음에 컴포넌트를 찾는 사람(사용자 본인 포함)이 "이건 어느 묶음 파일에 있더라"를 매번 기억해야 하는 부담이 생김. 7개면 숫자도 많지 않아 묶어서 얻는 이득이 적음.
> - **10년차 개발자**: **A**. import 시 `import Button from '../components/Button'`처럼 파일명=컴포넌트명이 1:1로 대응되면 IDE 자동완성·"정의로 이동"이 더 직관적이다. B(묶음 파일)는 컴포넌트 수가 20~30개로 늘어나 파일 탐색 자체가 피로해질 때 고려할 최적화이지, 7개 수준에서는 오히려 각 파일이 여러 export를 가져서 diff·리뷰 단위가 흐려지는 단점만 생긴다.
> - **기획자**: **A**. 사용자 관점 영향은 없지만, 유지보수 편의성 논리에 동의 — 기존 관례를 따르는 게 이번처럼 "구조를 새로 잡는" 작업에서 불필요한 새 규칙을 늘리지 않는 방법.

[Answer]: A

**Q-B.** `Accordion` 컴포넌트는 지금 두 군데서 쓰입니다 — (1) `EntryPage.tsx`의 "다른 날짜 기록/목표 설정/계정 설정" 같은 단순 접이식, (2) `DashboardPage.tsx`의 모임 회차 아코디언(열림 상태를 부모가 제어하고, 펼쳤을 때 참가자별 달성률까지 렌더링하는 복잡한 것). 이 둘을 하나의 `Accordion` 컴포넌트로 통합할까요, 아니면 단순 버전과 제어형(controlled) 버전을 분리할까요?

A) 하나로 통합 — `Accordion`이 `open`/`onToggle`을 선택적 prop으로 받아 비제어(내부 상태)/제어(부모 상태) 양쪽을 다 지원
B) 분리 — 단순 접이식은 `Accordion`(비제어), 모임 회차처럼 부모가 열림 상태를 아는 게 필요한 경우는 `ControlledAccordion`으로 별도

> 💡 **페르소나별 추천**
> - **PM**: **A**. React에서 "선택적 제어 prop" 패턴(`open`을 안 주면 내부 상태, 주면 부모가 제어)은 흔한 관례라 컴포넌트 이름이 하나로 유지되는 게 사용하는 입장에서 더 직관적 — "Accordion 쓸 때는 이거, 아닐 때는 저거"를 구분해서 기억할 필요가 없어짐.
> - **10년차 개발자**: **A, 단 타입으로 명확히 구분**. React의 uncontrolled/controlled 겸용 컴포넌트는 표준적인 패턴이고(`<details open>`이 원래 그런 식으로 동작), prop 타입을 `{ open?: boolean; onToggle?: (open: boolean) => void }`로 선택적으로 두면 구현 복잡도가 크게 늘지 않는다. B로 분리하면 오히려 두 컴포넌트가 내부적으로 거의 같은 마크업/스타일을 중복 구현하게 될 가능성이 높다.
> - **기획자**: **A**. 사용자가 두 화면(개인 기록/대시보드)에서 아코디언을 시각적으로 동일하게 느껴야 "일관된 디자인"이라는 이번 목표에 부합 — 컴포넌트가 나뉘면 나중에 한쪽만 스타일이 바뀌는 drift 위험도 있음.

[Answer]: 개발자 의견대로 A

### 3.2 Component Methods / Interfaces

**Q-C.** `Button` 컴포넌트의 variant 범위를 어디까지로 할까요? 현재 CSS에는 기본(primary, 파란 배경)과 `.secondary`(무채색) 두 종류만 있는데, 태그 선택용 `.tag-btn`(pill 모양)과 탭 전환용 `.view-tabs button`도 사실상 "버튼의 변형"입니다.

A) `Button`은 primary/secondary 2종만 담당, 탭(`view-tabs`)과 태그(`TagSelect`)는 각각 별도 컴포넌트로 유지 (Button과 무관)
B) `Button`이 variant prop(`primary`/`secondary`/`tab`/`tag`)으로 4종을 모두 포괄

> 💡 **페르소나별 추천**
> - **PM**: **A**. 탭·태그는 겉모습만 버튼(`<button>` 태그)이지 역할이 다르다 — 탭은 "현재 뷰 선택 상태"를 나타내는 내비게이션이고, 태그는 "다중/단일 선택값"을 나타내는 폼 컨트롤에 가깝다. 이미 `TagSelect`라는 별도 컴포넌트를 만들기로 했으니(Q-F) 탭도 자연스럽게 별도로 두는 게 일관적.
> - **10년차 개발자**: **A**. `Button`에 variant를 4종까지 늘리면 정작 "그냥 버튼"으로 써야 할 곳(예: 폼 제출)에서도 매번 `variant="primary"`를 명시해야 하는 보일러플레이트가 생기고, 탭/태그는 각각 고유한 상태(활성 뷰, 선택 여부)를 받아야 해서 props 인터페이스가 지저분해진다. 관심사 분리 원칙상 A가 깔끔하다 — `Button`은 순수 클릭 액션, `Tabs`/`TagSelect`는 각자의 선택 상태를 관리하는 별도 컴포넌트.
> - **기획자**: **A**. 사용자 경험 관점에서도 탭/태그/버튼은 실제로 다른 인터랙션(전환 vs 선택 vs 액션 실행)이라 다른 컴포넌트로 나뉘어 있는 게 오히려 각각의 스타일을 더 세밀하게 다듬기 쉬움 — "버튼 하나"로 퉁치면 나중에 탭만 살짝 다르게 하고 싶을 때 조건 분기가 늘어남.

[Answer]: A

### 3.3 Service Layer Design

**Q-D.** FR-3의 `GET /admin/users` — `frontend/src/api/client.ts`에 이 호출을 추가할 때, 기존 `listUsers()`(공개, active만)와 이름이 헷갈리지 않도록 명명이 필요합니다. 제안: `adminListAllUsers(token: string)`. 이 명명 방식(그리고 기존 `adminCreateUser`, `adminUpdateUserStatus` 등과 같은 `admin` 접두사 관례를 따름)에 동의하시나요, 다른 이름을 원하시나요?

A) 동의 — `adminListAllUsers(token)`로 진행
B) 다른 이름 원함 (아래 서술)

> 💡 **페르소나별 추천**
> - **PM**: **A**. 기존 관례(`adminCreateUser`, `adminUpdateUserStatus`, `adminCreateSeason`, `adminActivateSeason`)와 일관되게 이어지는 이름이라 새로 익힐 규칙이 없음. 리뷰어나 미래의 사용자 본인이 함수 목록만 보고도 "admin 접두사=관리자 전용, 토큰 필요"를 바로 알 수 있음.
> - **10년차 개발자**: **A**. 정확히 기존 명명 관례를 따른다 — 굳이 바꿀 이유를 찾기 어렵다. `list` + `All` + `Users`로 기존 공개 `listUsers()`와 명확히 구분되면서도 리소스명이 같아 관련성도 드러남.
> - **기획자**: **A**. 특별히 의견 낼 지점 없음 — 개발 관례를 따르는 게 맞다고 봄.

[Answer]: A

**Q-E.** 백엔드 `GET /admin/users` 핸들러는 어느 파일에 둘까요? 기존 `admin_handler.py`에는 `create_user`/`update_user_status`/`create_season`/`activate_season`이 있어 자연스러운 위치이지만, "목록 조회"라는 점에서 `users_handler.py`(기존 `list_users`가 있는 곳)에 `require_admin`을 검사하는 별도 함수로 추가하는 방법도 있습니다.

A) `admin_handler.py`에 `list_all_users` 함수로 추가 (관리자 전용 액션이 모여있는 파일 기준)
B) `users_handler.py`에 `list_all_users`로 추가 (리소스가 Users라는 점 기준, 내부에서 `require_admin` 호출)

> 💡 **페르소나별 추천**
> - **PM**: **A**. `backend/CLAUDE.md`에 이미 "`/admin/*` 엔드포인트는 참가자 토큰과 분리된 별도 인증 미들웨어로 검증한다"는 원칙이 있고, 지금 `admin_handler.py`가 정확히 "인증 방식이 다른 관리자 전용 액션들의 모음"이라는 경계로 서 있다. 이 경계를 유지하는 게 다음에 관리자 기능이 추가될 때도 예측 가능함.
> - **10년차 개발자**: **A**. `users_handler.py`의 기존 함수(`list_users`, `change_pin`, `get_goal`, `set_goal`)는 전부 참가자 토큰 기준(`require_participant_self` 또는 무인증)인데, 여기에 `require_admin` 함수 하나를 섞으면 "이 파일의 모든 함수는 참가자 인증"이라는 이 파일의 암묵적 불변식이 깨진다. `admin_handler.py`에 두면 "이 파일=전부 admin 전용"이라는 규칙이 그대로 유지되어 실수로 잘못된 인가 헬퍼를 쓸 위험도 줄어든다.
> - **기획자**: **A**. 코드 조직 문제라 사용자 경험과 무관하지만, 인증 방식이 다른 코드가 섞이지 않는 쪽이 향후 버그 위험을 낮춘다는 개발자 논리에 동의.

[Answer]: A

### 3.4 Component Dependencies

**Q-F.** `TagSelect`(공용 컴포넌트)는 현재 `EntryPage.tsx`에서 두 가지 다른 용도로 쓰입니다 — (1) 단일 선택(학습 수단 — 하나만 선택), (2) 다중 선택(학습 내용 — 여러 개 토글). 하나의 컴포넌트가 `mode="single" | "multi"` prop으로 둘 다 지원하게 할까요, 아니면 애초에 별도 컴포넌트(`TagSingleSelect`/`TagMultiSelect`)로 나눌까요?

A) 하나의 `TagSelect`가 `mode` prop으로 단일/다중 모두 지원
B) 별도 컴포넌트로 분리

> 💡 **페르소나별 추천**
> - **PM**: **A**. 시각적으로 완전히 동일한 컴포넌트(태그 pill 버튼 그룹)이고 차이는 "선택 시 배열에 추가/제거하느냐 값을 교체하느냐"뿐이라, 별도 컴포넌트로 나누면 스타일링 코드가 그대로 중복될 뿐 얻는 이점이 없음.
> - **10년차 개발자**: **A**. `value: string | string[]`, `onChange: (v: string | string[]) => void` 형태의 유니온으로 표현하거나, 혹은 더 간단히 `selected: string[]`+`multiple: boolean` prop 하나로 단일/다중을 모두 표현 가능 — 실제 렌더링 로직(태그 목록을 뿌리고 클릭 핸들러 붙이는 것)은 완전히 동일해서 분기는 "클릭 시 배열을 교체하느냐 토글하느냐"라는 한 줄짜리 조건문 수준. 컴포넌트를 나눌 만큼 복잡하지 않다.
> - **기획자**: **A**. 사용자가 보기에 "태그를 고르는 방식"이라는 동일한 상호작용 패턴이라 하나의 개념(컴포넌트)으로 묶여 있는 게 자연스러움.

[Answer]: A

### 3.5 Design Patterns / Constraints

**Q-G.** FR-2의 `LoadingPlaceholder`는 지금 `<p className="hint">불러오는 중...</p>` 형태로 텍스트만 4곳(EntryPage, DashboardPage 등)에 흩어져 있습니다. 이 컴포넌트에 스켈레톤 UI(회색 박스 애니메이션) 같은 시각적 요소를 도입할까요, 아니면 지금처럼 텍스트 안내만 컴포넌트로 감싸는 수준으로 할까요?

A) 텍스트 안내만 컴포넌트화 (기존과 동일한 느낌 유지, 재사용성만 확보)
B) 스켈레톤 UI 등 시각적 로딩 표시 도입 (더 세련된 느낌이지만 작업량 증가)

> 💡 **페르소나별 추천**
> - **PM**: **A**. API 응답이 빠른(참가자 5명 규모, DynamoDB 단순 조회 위주) 앱이라 로딩 상태가 화면에 노출되는 시간 자체가 매우 짧다 — 스켈레톤 UI는 로딩이 눈에 띄게 오래 걸릴 때 체감 효과가 큰 패턴인데, 이 앱에서는 투입 대비 사용자가 느낄 차이가 작다.
> - **10년차 개발자**: **A**. 스켈레톤 UI는 컴포넌트마다 "실제 콘텐츠의 레이아웃과 닮은 자리표시자"를 따로 설계해야 해서(카드형 스켈레톤, 리스트형 스켈레톤 등) 사실상 컴포넌트 하나가 아니라 여러 변형이 필요해지는 경우가 많다 — 이번 디자인 재작업의 핵심(투박함 해소)과는 거리가 있는 부가 작업. 텍스트 컴포넌트화만으로 재사용성 목표는 충분히 달성됨.
> - **기획자**: **A, 다만 스타일은 새 톤에 맞게**. 스켈레톤 자체는 과할 수 있지만, 지금처럼 회색 `.hint` 텍스트 한 줄보다는 살짝 더 정돈된 형태(중앙 정렬, 여백 등)로는 다듬을 필요가 있음 — "투박함 해소"라는 목적에 비추면 텍스트여도 톤이 안 맞으면 여전히 투박해 보일 수 있으므로 이 컴포넌트도 새 디자인 토큰을 적용하는 선에서는 신경써야 함.

[Answer]: A
