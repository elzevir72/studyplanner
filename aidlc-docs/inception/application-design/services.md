# Services

이 프로젝트는 별도 "서비스 계층" 없이 프론트는 `api/client.ts`(오케스트레이션 없는 얇은 fetch 래퍼), 백엔드는 핸들러가 곧 오케스트레이션 지점이다. 신규 서비스 계층을 도입하지 않고 기존 패턴을 그대로 따른다.

## Frontend — API Client 계층 (`frontend/src/api/client.ts`)

### 변경 사항
- **신규 함수**: `adminListAllUsers(token)` — [component-methods.md](component-methods.md) 참고. 기존 `admin*` 함수 그룹(116~138행) 바로 아래에 추가해 관리자 전용 함수들이 파일 내에서 한 구역에 모이는 기존 배치를 유지.
- **명명 규칙 준수**: `admin` 접두사(Q-D=A) — 공개 `listUsers()`와 명확히 구분.
- **그 외 기존 함수는 변경 없음** — FR-1(drift 해소)·FR-2(디자인)는 API 계약에 영향 없음.

### 오케스트레이션 패턴 (기존 유지)
- `client.ts`는 각 엔드포인트를 1:1로 얇게 래핑할 뿐, 여러 API 호출을 조합하는 로직은 페이지 컴포넌트(`useEffect`, 이벤트 핸들러)에 둔다 — 예: `DashboardPage.tsx`의 `loadMeetingRounds`가 `meetingRoundsDashboard()`와 `listMeetings()`를 `Promise.all`로 묶는 것과 동일한 패턴을 따름.
- 신규 `adminListAllUsers`도 이 원칙을 따라 `client.ts`에는 단일 호출만 두고, 조합이 필요하면 `AdminPage.tsx`의 `UpdateUserStatusForm`(또는 상위 `AdminPage`)에서 처리.

## Backend — 핸들러 계층 오케스트레이션

### 변경 사항
- **신규 핸들러**: `admin_handler.list_all_users` — 인가(`require_admin`) → 리포지토리 호출(`users_repo.list_all_users()`) → 응답 조립(민감 필드 제외)이라는 기존 admin 핸들러들의 표준 구조(`create_user`와 동일 패턴)를 그대로 따름. 신규 리포지토리 로직은 불필요(`list_all_users()`가 이미 존재).
- **인가 미들웨어**: 기존 `require_admin`(`backend/common/auth.py:97`)을 그대로 재사용 — 신규 인가 로직 불필요.

### 오케스트레이션 원칙 (기존 유지, backend/CLAUDE.md 근거)
- 핸들러 하나 = 엔드포인트 하나 책임 원칙 유지.
- DynamoDB 접근은 반드시 `repos/`를 통해서만 — 핸들러에서 직접 `boto3` 호출 금지 (기존 원칙, 이번 신규 핸들러도 동일 적용).

## Infra — 라우팅 계층 (`serverless.yml`, 리포 루트)

### 변경 사항
- **신규 함수 정의 추가**:
  ```yaml
  adminListAllUsers:
    handler: backend/handlers/admin_handler.list_all_users
    events:
      - httpApi: { path: '/api/admin/users', method: get }
  ```
  - **주의**: 기존 `POST /api/admin/users`(`create_user`)와 경로가 같고 메서드만 다름(`GET`) — Serverless Framework/API Gateway에서 동일 경로에 메서드가 다른 여러 함수를 정의하는 것은 기존 프로젝트에도 이미 있는 패턴(예: `PUT /api/users/{user_id}/goal` vs `GET /api/users/{user_id}/goal`)이라 문제 없음.
  - 모든 `path` 값은 반드시 따옴표로 감싼다(과거 YAML 파싱 버그 회피 관례, `infra/CLAUDE.md`/과거 이력 참고).
- FR-5(Config 테이블 제거)도 같은 파일을 건드리므로, [requirements.md](../requirements/requirements.md) NF-4/NF-5에 따라 이 두 변경은 **서로 다른 커밋으로 분리**하고 순서를 명확히 한다: (1) FR-3 엔드포인트 추가 커밋, (2) FR-5 Config 테이블 제거 커밋 — 각각 독립적으로 배포 검증 가능하도록.
- **FR-5 변경 범위 확정** (IAM 구조 확인 결과, [component-dependency.md](component-dependency.md) 참고): `provider.iam.role.statements`가 전역 공용 역할이라, `Config` 테이블 제거 시 (1) `provider.environment.CONFIG_TABLE` 환경변수 삭제, (2) `iam.role.statements.Resource`에서 `!GetAtt ConfigTable.Arn` 삭제, (3) `resources`(또는 동급 섹션)의 `ConfigTable` 정의 자체 삭제 — 이 3곳만 수정하면 되고, 함수별 개별 IAM 정책은 건드릴 필요 없음(애초에 함수별로 분리되어 있지 않으므로).
