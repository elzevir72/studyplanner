# Domain Entities — 고도화 1차 배치

이번 unit에서 신규로 도입되는 엔티티는 `AdminUserSummary`(FR-3) 하나뿐이다. 기존 엔티티(`Entry`, `Season`, `Meeting` 등)는 변경 없음.

## AdminUserSummary (신규, 프론트엔드 타입)

```ts
// frontend/src/types.ts
export interface AdminUserSummary {
  user_id: string
  display_name: string
  status: 'active' | 'inactive'
}
```

- **관계**: 백엔드 `Users` 테이블 레코드의 부분 뷰(view) — `pin_hash`, `daily_goal`, `created_at` 등 민감/불필요 필드는 제외.
- **기존 `UserSummary`와의 관계**: 별도 타입으로 유지(합치지 않음) — `UserSummary`는 공개 `GET /users`(active만, 참가자 로그인 화면용) 응답 타입이고, `AdminUserSummary`는 관리자 전용 `GET /admin/users`(전체, 관리자 화면용) 응답 타입. 두 타입이 우연히 필드가 겹치더라도(`user_id`, `display_name`) 목적과 노출 범위가 다르므로 별개 타입으로 구분해 혼용 실수를 방지한다.

## 백엔드 응답 형태 (참고, 스키마 변경 아님)

```python
# admin_handler.list_all_users의 반환값 형태
[
    {"user_id": str, "display_name": str, "status": "active" | "inactive"},
    ...
]
```

- `Users` DynamoDB 테이블 자체의 스키마는 변경되지 않는다 — 이미 `status` 필드가 존재(`users_repo.create_user`가 기본값 `"active"`로 생성).
