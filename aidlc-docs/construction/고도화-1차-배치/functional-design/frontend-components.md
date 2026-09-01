# Frontend Components — 고도화 1차 배치

Application Design([components.md](../../../inception/application-design/components.md), [component-methods.md](../../../inception/application-design/component-methods.md))의 시그니처를 기반으로, 상태/상호작용/검증 흐름을 확정한다.

## 컴포넌트 계층

```
App.tsx (변경 없음)
├── LoginPage.tsx
│   ├── FormField (이름 select, PIN input)
│   ├── Button (입장하기)
│   └── Message (error)
├── EntryPage.tsx
│   ├── DdayBanner (기존, 변경 없음)
│   ├── Card (variant="highlight" — today-card)
│   │   ├── Card × N (variant="default" — study-item-block, 반복)
│   │   │   ├── FormField × 3 (학습 수단, 학습 내용, 학습량)
│   │   │   │   └── TagSelect (수단=단일, 내용=다중)
│   │   │   └── Button (이 수단 삭제)
│   │   ├── Button (+ 학습 수단 추가)
│   │   ├── Message (달성률 힌트 / hint)
│   │   ├── FormField (메모)
│   │   ├── Message (error)
│   │   └── Button (저장/삭제)
│   ├── Accordion × 3 (비제어 — 다른 날짜 기록, 목표 설정, 계정 설정)
│   │   └── (각 내부에 FormField/TagSelect/Button/Message 재사용)
│   └── LoadingPlaceholder (기록 불러오는 중)
├── DashboardPage.tsx
│   ├── DdayBanner (기존)
│   ├── Card (요약 칩 — SummaryStrip)
│   ├── Accordion × N (제어형 — 모임 회차, `open`/`onToggle`로 부모가 상호배타 관리)
│   │   ├── FormField × 2 (모임 날짜, 메모 — EditMeetingForm)
│   │   ├── Button (저장/취소/삭제)
│   │   └── Message (error / 삭제 권한 안내)
│   ├── Card × N (예정된 모임 — feed-item)
│   ├── FormField × 2 (새 모임 등록 — AddMeetingForm)
│   ├── Button (모임 등록)
│   └── LoadingPlaceholder (대시보드 불러오는 중)
└── AdminPage.tsx
    ├── FormField + Button + Message (관리자 로그인)
    ├── Card (참가자 계정 생성 — CreateUserForm, 변경 없음: 신규 생성이라 드롭다운 대상 아님)
    ├── Card (참가자 상태 변경 — UpdateUserStatusForm, 신규: 드롭다운)
    │   └── FormField (참가자 선택 드롭다운 — adminListAllUsers 데이터)
    ├── Card (시즌 생성 — CreateSeasonForm)
    └── Card (시즌 전환 — ActivateSeasonForm)
```

## 컴포넌트별 상태/상호작용 상세

### `TagSelect`
```ts
interface TagSelectProps {
  options: string[]
  selected: string[]
  multiple?: boolean
  onChange: (next: string[]) => void
}
```
**상호작용 규칙** (business-rules.md 반영):
- `multiple=false`(기본값)일 때 옵션 클릭:
  - 클릭한 옵션이 이미 선택된 상태 → 선택 해제(`onChange([])`) — **Q-1=A**
  - 클릭한 옵션이 선택되지 않은 상태 → 그 옵션으로 교체(`onChange([option])`)
- `multiple=true`일 때 옵션 클릭:
  - 이미 선택됨 → 배열에서 제거
  - 선택 안 됨 → 배열에 추가
- **사용처 매핑**:
  - `EntryPage.tsx` 학습 수단: `multiple=false`
  - `EntryPage.tsx` 학습 내용: `multiple=true`
  - `EntryPage.tsx` 목표 설정의 수단: `multiple=false`

### `Accordion`
```ts
interface AccordionProps {
  summary: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onToggle?: (open: boolean) => void
  defaultOpen?: boolean
}
```
**상태 관리 패턴**:
- **비제어** (`EntryPage.tsx` 3곳): `open`/`onToggle` 미전달 → 내부 `useState`로 자체 관리, 기본 닫힘(`defaultOpen` 미지정 시 false).
- **제어형 + 상호배타** (`DashboardPage.tsx` 모임 회차): 부모가 `openRound: number | null` state 하나로 관리, 각 `Accordion`에 `open={openRound === r.round}` `onToggle={(isOpen) => setOpenRound(isOpen ? r.round : null)}` 전달 — **Q-2=A**, `Accordion` 자체는 형제 관계를 모른 채 단순히 자기 open 상태를 부모에게 위임.
- 초기값: `rounds` 로드 완료 시 `openRound = rounds[rounds.length - 1]?.round ?? null` (가장 최근 회차 기본 펼침, 기존 동작 유지).

### `Card`
```ts
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'highlight'
  className?: string
}
```
**Q-4=A 반영**:
- `variant='highlight'`: `EntryPage.tsx`의 today-card(오늘 기록 강조)에만 사용 — 강조 배경색 적용.
- `variant='default'`(기본값): 나머지 모든 카드형 컨테이너(study-item-block, 요약 칩, feed-item, AdminPage의 각 폼 카드 등).
- `className`: variant로 표현되지 않는 페이지별 미세 조정(예: flex 레이아웃 훅)이 필요할 때만 보조적으로 사용 — variant로 해결 가능한 케이스에 className을 남용하지 않는다.

### `FormField` (관리자 상태 변경 드롭다운 — 신규 상세)
`AdminPage.tsx`의 `UpdateUserStatusForm`:
```ts
// 상태 흐름
const [users, setUsers] = useState<AdminUserSummary[]>([])
const [userId, setUserId] = useState('')
const [status, setStatus] = useState<'active' | 'inactive'>('active')

useEffect(() => {
  adminListAllUsers(token).then(setUsers)
}, [token])

// 참가자 선택 변경 시 — Q-3=B: 선택한 참가자의 현재 상태로 select를 초기화
const handleUserSelect = (nextUserId: string) => {
  setUserId(nextUserId)
  const found = users.find((u) => u.user_id === nextUserId)
  if (found) setStatus(found.status)
}
```
- 참가자 드롭다운(`FormField` + `<select>`)의 옵션은 `adminListAllUsers()` 결과 전체(active+inactive) — `display_name (status)` 형태로 표시해 관리자가 현재 상태를 드롭다운에서도 바로 알 수 있게 한다(예: "김철수 (active)").
- 최초 로드 시 `users[0]`을 기본 선택하고 그 상태로 `status`를 초기화(기존 `ActivateSeasonForm`의 "목록 로드 후 첫 항목 기본 선택" 패턴과 동일).

### `Button` / `Message` / `LoadingPlaceholder`
- Application Design의 시그니처에서 변경 없음. 상호작용 로직 없이 순수 프레젠테이션.

## 폼 검증 규칙 (기존 유지, 컴포넌트 전환으로 인한 변경 없음)

- `EntryPage.tsx` 기록 저장: `study_items` 중 `method`와 `amount.value > 0`을 모두 만족하는 항목만 유효 — 기존 로직 그대로, TagSelect 재클릭 해제로 인해 방금 빈 값이 된 항목은 자동으로 필터링되어 별도 에러 처리 불필요.
- `EntryPage.tsx` 목표 저장: `method`와 `value > 0`을 만족하는 목표만 유효 — 기존 로직 유지.
- `AdminPage.tsx`의 각 폼: 기존 `required` 속성 기반 브라우저 검증 유지, 신규 드롭다운도 참가자 미선택 시 제출 불가(select는 목록 로드 후 항상 기본값을 가지므로 실질적으로 빈 값 케이스 없음).

## API 통합 지점

| 컴포넌트/화면 | 호출 API | 비고 |
|---|---|---|
| `AdminPage.tsx` UpdateUserStatusForm | `adminListAllUsers(token)` (신규), `adminUpdateUserStatus(user_id, status, token)` (기존) | 신규 함수 1개 추가만, 기존 상태 변경 API는 그대로 |
| 그 외 모든 컴포넌트 | 기존 API 그대로 | FR-2(디자인/컴포넌트 재작업)는 API 계약에 영향 없음 (NF-1) |
