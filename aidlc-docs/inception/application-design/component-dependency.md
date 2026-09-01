# Component Dependency

## Frontend — 페이지 → 공용 컴포넌트 의존 관계

| 페이지 | Button | Card | FormField | TagSelect | Message | Accordion | LoadingPlaceholder |
|---|---|---|---|---|---|---|---|
| `LoginPage.tsx` | ✅ (입장하기) | — | ✅ (이름/PIN) | — | ✅ (error) | — | — |
| `EntryPage.tsx` | ✅ (저장/취소/추가/삭제 등 다수) | ✅ (today-card, study-item-block) | ✅ (모든 label+input) | ✅ (학습 수단=단일, 학습 내용=다중) | ✅ (error/hint) | ✅ (다른 날짜 기록/목표 설정/계정 설정) | ✅ (기록 불러오는 중) |
| `DashboardPage.tsx` | ✅ (모임 등록/수정/삭제, 뷰 탭 제외) | ✅ (요약 칩, feed-item) | ✅ (모임 날짜/메모 입력) | — | ✅ (error/hint) | ✅ (모임 회차 — 제어형, `open`/`onToggle` 사용) | ✅ (대시보드 불러오는 중) |
| `AdminPage.tsx` | ✅ (로그인/생성/변경/전환) | ✅ (각 폼 카드) | ✅ (모든 label+input, 신규: 참가자 선택 드롭다운) | — | ✅ (error/hint) | — | — |

- `TagSelect`는 `EntryPage.tsx`에서만 사용 (학습 수단·학습 내용). 다른 페이지에는 태그형 선택 UI가 없음.
- `Accordion`은 `EntryPage.tsx`(비제어, 3곳)와 `DashboardPage.tsx`(제어형, 모임 회차 목록)에서 모두 쓰이되, 동일한 컴포넌트를 다른 모드로 사용 (Q-B=A 결정 반영).

## Frontend — 컴포넌트 간 의존 (신규 컴포넌트 상호 참조)

- `FormField`는 `children`으로 순수 `<input>`/`<select>`/`<textarea>` 또는 `TagSelect`를 받을 수 있음 (예: "학습 수단" 필드는 `FormField` 안에 `TagSelect` + 자유 입력 `<input>`을 함께 배치하는 기존 EntryPage 패턴 유지).
- `Card`는 다른 컴포넌트를 포함하는 컨테이너로만 쓰이고, 다른 신규 컴포넌트를 내부적으로 참조하지 않음 (순수 레이아웃 컴포넌트).
- `Accordion`의 `summary`/`children`은 임의의 React 노드를 받으므로 `Card`, `Button`, `Message` 등을 자유롭게 포함 가능 — 상호 의존이라기보다 합성(composition) 관계.

## Backend — 신규 엔드포인트 의존 관계

```
GET /api/admin/users
  → admin_handler.list_all_users
      → require_admin (backend/common/auth.py)  [인가]
      → users_repo.list_all_users (backend/repos/users_repo.py, 기존 함수 재사용)  [데이터]
      → responses.ok (backend/common/responses.py)  [응답 조립, pin_hash 등 민감 필드 제외]
```

- 신규 리포지토리 의존성 없음 — `users_repo.list_all_users()`가 이미 존재.
- 신규 인가 의존성 없음 — `require_admin`이 이미 존재.
- **DynamoDB 테이블 의존**: `USERS_TABLE` (기존 `Users` 테이블 그대로 재사용). **IAM 권한 확인 완료**: `serverless.yml`의 `provider.iam.role.statements`는 함수별이 아니라 전역 공용 역할이며 `dynamodb:Scan`을 포함한 전체 CRUD 권한이 이미 `UsersTable.Arn`에 부여되어 있음 (`serverless.yml:26-42`) — 신규 `list_all_users` 핸들러에 IAM 정책 추가가 전혀 필요 없음.

## Communication Pattern 요약

- **프론트↔백엔드**: REST 호출(`fetch` 기반 `client.ts`) — 변경 없음, 신규 함수 1개만 추가.
- **컴포넌트↔컴포넌트(프론트 내부)**: props를 통한 단방향 데이터 흐름만 사용 — 신규 컴포넌트도 전역 상태(Context, Redux 등) 도입 없이 페이지 컴포넌트가 소유한 state를 props로 전달받는 기존 패턴을 따름 (NF-3 원칙 준수).
- **핸들러↔리포지토리(백엔드 내부)**: 함수 호출 — 신규 의존 없음, 기존 모듈 재사용만으로 충족.
