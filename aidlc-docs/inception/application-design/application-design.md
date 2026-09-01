# Application Design — 통합 문서

이 문서는 [components.md](components.md), [component-methods.md](component-methods.md), [services.md](services.md), [component-dependency.md](component-dependency.md) 4개 산출물을 통합한 개요입니다. 상세 내용은 각 문서를 참고하세요.

## 배경

이 프로젝트는 brownfield이며 이미 아키텍처(백엔드 handlers/repos/domain 계층, 프론트 4페이지 구조)가 확립되어 있습니다. 이번 Application Design은 신규 설계가 아니라 [requirements.md](../requirements/requirements.md)의 5개 요구사항(FR-1~5) 중 실제로 컴포넌트 설계가 필요한 두 곳을 기존 구조에 편입시키는 작업입니다:

- **FR-2** (디자인 + 프론트 아키텍처 재작업) → 신규 공용 컴포넌트 7종
- **FR-3** (관리자 드롭다운) → 신규 백엔드 엔드포인트 1개

FR-1(drift 해소), FR-4(문서 정정), FR-5(Config 테이블 제거)는 기존 컴포넌트 내부 수정이거나 컴포넌트 경계와 무관한 변경이라 이 설계 문서에서는 다루지 않고 Functional Design/Construction 단계에서 직접 처리합니다.

## 설계 결정 요약

모든 결정은 [application-design-plan.md](../plans/application-design-plan.md)의 7개 질문(Q-A~Q-G)에 대한 사용자 답변(전부 A로 확정)을 근거로 합니다.

| 질문 | 결정 | 반영 위치 |
|---|---|---|
| Q-A: 컴포넌트 파일 구성 | 파일 하나당 컴포넌트 하나 (기존 `DdayBanner.tsx` 관례) | components.md |
| Q-B: Accordion 통합 여부 | 하나로 통합, `open`/`onToggle` 선택적 prop으로 제어/비제어 겸용 | components.md, component-methods.md |
| Q-C: Button variant 범위 | primary/secondary 2종만, 탭·태그는 별도 컴포넌트 | components.md |
| Q-D: API 함수 명명 | `adminListAllUsers(token)`, 기존 `admin` 접두사 관례 준수 | services.md, component-methods.md |
| Q-E: 신규 핸들러 위치 | `admin_handler.py`에 추가 (users_handler.py의 참가자-전용 불변식 보존) | components.md, services.md |
| Q-F: TagSelect 단일/다중 | 하나의 컴포넌트가 `multiple` prop으로 겸용 | components.md, component-methods.md |
| Q-G: LoadingPlaceholder 시각 요소 | 텍스트 수준 유지, 스켈레톤 UI 도입 안 함 | components.md |

## 신규 컴포넌트 한눈에 보기

**Frontend** (`frontend/src/components/`): `Button`, `Card`, `FormField`, `TagSelect`, `Message`, `Accordion`, `LoadingPlaceholder` — 7개 파일, 상세는 [components.md](components.md) / [component-methods.md](component-methods.md).

**Backend**: `admin_handler.list_all_users` — 신규 함수 1개, 기존 `users_repo.list_all_users()`(이미 존재)와 `require_admin`(이미 존재)을 재사용하므로 신규 하위 의존성 없음. 상세는 [component-dependency.md](component-dependency.md).

**Infra**: `serverless.yml`에 `GET /api/admin/users` 라우트 1개 추가. IAM 권한은 전역 공용 역할이라 별도 정책 추가 불필요(확인 완료). 상세는 [services.md](services.md).

## 페이지 → 컴포넌트 적용 범위

4개 페이지(`LoginPage`, `EntryPage`, `DashboardPage`, `AdminPage`) 모두 신규 컴포넌트로 전환합니다(NF-2: 일부만 전환하는 반쪽 리팩터 금지). 페이지별 실제 사용 매트릭스는 [component-dependency.md](component-dependency.md)의 표를 참고하세요 — `EntryPage`가 7종 전부, `DashboardPage`가 6종(TagSelect 제외), `AdminPage`가 4종(Button/Card/FormField/Message), `LoginPage`가 3종(Button/FormField/Message)을 사용합니다.

## 변경 없음이 확인된 영역

- 라우팅 구조(`App.tsx`), 전역 상태관리 방식(React 기본 state) — 그대로 유지
- 기존 API 계약 대부분(신규 함수 1개만 추가, 기존 함수 시그니처 변경 없음)
- IAM 정책 구조 — 전역 공용 역할이라 FR-3(신규 엔드포인트)도 FR-5(Config 테이블 제거)도 함수별 정책 조정 불필요

## 다음 단계와의 경계

이 문서는 "무엇을(what) 어디에(where)" 둘지까지만 다룹니다. 각 컴포넌트의 정확한 스타일 값(색상 토큰, 여백 수치 등), 신규 디자인 톤의 구체적 CSS, `Accordion`의 정확한 상태 전이 로직 등 "어떻게(how)"는 CONSTRUCTION 단계의 Functional Design에서 다룹니다.
