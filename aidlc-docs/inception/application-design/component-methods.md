# Component Methods

메서드/props 시그니처. 상세 비즈니스 로직(스타일 값, 정확한 렌더링 분기 등)은 Functional Design(CONSTRUCTION 단계)에서 정의.

## Frontend

### `Button`
```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary'  // 기본값 'primary'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}
```
- **Purpose**: 클릭 액션 버튼 렌더링. `disabled`일 때 시각적 비활성 처리.

### `Card`
```ts
interface CardProps {
  children: React.ReactNode
  className?: string  // 페이지별 추가 스타일 훅용, 선택적
}
```
- **Purpose**: children을 카드 형태로 감싸 렌더링.

### `FormField`
```ts
interface FormFieldProps {
  label: string
  htmlFor?: string
  children: React.ReactNode  // input/select/textarea
}
```
- **Purpose**: label과 입력 요소를 일관된 레이아웃으로 배치.

### `TagSelect`
```ts
interface TagSelectProps {
  options: string[]
  selected: string[]           // 단일 선택도 길이 1 배열로 표현
  multiple?: boolean           // 기본값 false(단일) — true면 다중 토글
  onChange: (next: string[]) => void
}
```
- **Purpose**: 옵션 목록을 pill 버튼으로 렌더링, 클릭 시 `multiple` 여부에 따라 값을 교체(단일)하거나 토글(다중)해 `onChange`로 전달.
- **Input/Output**: 입력은 옵션 배열+현재 선택 상태, 출력은 `onChange` 콜백을 통한 다음 선택 상태.

### `Message`
```ts
interface MessageProps {
  kind: 'error' | 'hint' | 'success'
  children: React.ReactNode
}
```
- **Purpose**: 종류별 스타일(색상)로 메시지 텍스트 렌더링.

### `Accordion`
```ts
interface AccordionProps {
  summary: React.ReactNode
  children: React.ReactNode
  open?: boolean                       // 지정 시 제어형(부모가 상태 소유)
  onToggle?: (open: boolean) => void   // 제어형일 때 상태 변경 통지
  defaultOpen?: boolean                // 비제어형일 때 초기 열림 상태
}
```
- **Purpose**: `open`이 전달되면 제어형(부모 상태 그대로 반영), 전달되지 않으면 내부 state로 비제어 동작. `<details>`/`<summary>` 시맨틱 유지.
- **Input/Output**: 제어형에서는 `onToggle`로 상위에 열림/닫힘 이벤트를 알려야 부모가 `open`을 갱신할 수 있음(단방향 데이터 흐름).

### `LoadingPlaceholder`
```ts
interface LoadingPlaceholderProps {
  label?: string  // 기본값 "불러오는 중..."
}
```
- **Purpose**: 로딩 안내 텍스트를 통일된 스타일로 렌더링.

## Backend

### `admin_handler.list_all_users(event, context)`
```python
@handle_errors
def list_all_users(event, context) -> dict:
    """
    require_admin(event)로 인가 검사 후,
    users_repo.list_all_users()의 전체 유저(active+inactive)를
    [{"user_id", "display_name", "status"}, ...] 형태로 반환.
    """
```
- **Purpose**: 관리자 화면의 참가자 상태 변경 드롭다운에 필요한 전체 목록 제공.
- **Input**: API Gateway HTTP API v2 event (Authorization 헤더에 admin 토큰 필요), path/body 파라미터 없음.
- **Output**: `responses.ok([...])` — `pin_hash` 등 민감 필드는 제외(기존 `admin_handler.create_user`의 필드 제외 관례 준수).

## Frontend API Client (신규 함수)

### `adminListAllUsers`
```ts
export interface AdminUserSummary {
  user_id: string
  display_name: string
  status: 'active' | 'inactive'
}

export const adminListAllUsers = (token: string) =>
  request<AdminUserSummary[]>('/api/admin/users', {}, token)
```
- **Purpose**: FR-3 신규 엔드포인트 호출. `frontend/src/api/client.ts`에 기존 `admin*` 함수들과 같은 위치(관리자 섹션)에 추가.
- **Type 추가**: `frontend/src/types.ts`에 `AdminUserSummary` 인터페이스 신설 (기존 `UserSummary`는 `status` 없이 공개 목적 그대로 유지 — 혼용하지 않음).
