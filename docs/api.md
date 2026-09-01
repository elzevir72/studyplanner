# API 엔드포인트

Base path: `/api` (API Gateway → Lambda, Python). 인증이 필요한 엔드포인트는 `Authorization: Bearer <token>` 헤더 필요 (로그인 시 발급되는 단기 서명 토큰, 정식 세션 관리 아님).

## 인증
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/users` | 사용자 선택 드롭다운용 목록 (`user_id`, `display_name`만 반환, PIN 정보 없음). 기본적으로 `status="active"`인 유저만 반환 | 불필요 |
| POST | `/auth/verify` | `{user_id, pin}` → PIN 검증, 성공 시 단기 토큰 발급 | 불필요 |
| PUT | `/users/{user_id}/pin` | 본인 PIN 변경 `{current_pin, new_pin}` | 필요 (본인만) |

- 탈퇴한 유저(`status="inactive"`)는 삭제되지 않고 데이터가 보존됨. 드롭다운/대시보드에는 안 보이지만 과거 기록 자체는 남아있음.
- 참가자 계정 최초 생성 및 초기 PIN 설정은 참가자 본인이 아니라 관리자가 함 (아래 "관리자" 섹션). 참가자는 로그인 후 원하면 `PUT /users/{user_id}/pin`으로 스스로 변경 가능.

## 관리자
스터디 참가자(`Users`)와 완전히 분리된 단일 관리자 계정. 참가자 드롭다운 등 일반 사용자 흐름에는 전혀 노출되지 않고, 별도 경로(`/admin`)로만 접근한다.

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| POST | `/admin/auth/verify` | `{password}` → 검증 성공 시 관리자 전용 토큰 발급 | 불필요 |
| POST | `/admin/users` | 신규 참가자 계정 생성 `{user_id, display_name, pin}` | 필요 (관리자) |
| GET | `/admin/users` | 참가자 전체 목록 (`active`+`inactive`, `user_id`/`display_name`/`status`) — 관리자 화면의 참가자 상태 변경 드롭다운용 | 필요 (관리자) |
| PATCH | `/admin/users/{user_id}` | 참가자 `status` 변경 (`active`/`inactive`) | 필요 (관리자) |
| POST | `/admin/seasons` | 신규 시즌 생성 `{season_id, name, start_date, end_date, exam_date, target_level}` | 필요 (관리자) |
| PATCH | `/admin/seasons/{season_id}/activate` | 해당 시즌을 `is_current=true`로 전환. 기존에 `is_current=true`였던 시즌은 자동으로 `false`로 전환됨 (원자적 처리 필요) | 필요 (관리자) |

- 관리자 토큰은 참가자 토큰과 스코프가 분리되어, 참가자 전용 엔드포인트(`/entries/*` 등)에는 사용할 수 없고 그 반대도 마찬가지.
- 관리자가 참가자 계정 생성 시 초기 PIN을 함께 지정하고, 계정/PIN 정보를 참가자에게 직접(예: 메신저) 전달하는 것을 전제로 한다 — 별도 초대 이메일/링크 시스템은 만들지 않음.

## 시즌
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/seasons` | 시즌 목록 (과거 포함) | 불필요 |
| GET | `/seasons/current` | 현재 진행 중인 시즌 정보 | 불필요 |
| GET | `/dashboard/season/{season_id}` | 해당 시즌 전체 요약 (참가자별 기록 수, 개인 달성률 추이) | 불필요 |

- 새로 생성되는 기록은 항상 현재 시즌(`/seasons/current`)에 자동 태깅됨 — 클라이언트가 시즌을 직접 선택하지 않음.
- `/seasons/current` 응답에는 `exam_date`가 포함되며, 프론트는 이를 이용해 "OO 시험까지 OO일 남았습니다" 배너를 계산해 표시한다(접속 시에만 노출되는 정보성 배너, 이메일/푸시 등 능동 알림 아님).
- 시즌 생성 및 전환은 참가자가 아니라 관리자 전용 기능 (아래 "관리자" 섹션).
- 여러 스터디 그룹(다른 어학/자격증 등)이 생기는 경우, 이 리포지토리 안에서 그룹 개념을 나누지 않고 **그룹별로 별도 배포**한다 (별도 DynamoDB 테이블 + 별도 스택). 자세한 내용은 [docs/data-model.md](data-model.md) 참고.

## 목표 설정
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/users/{user_id}/goal` | 현재 목표(`daily_goal`) 조회 — 수단별 목표 리스트 | 불필요 (공유 목적) |
| PUT | `/users/{user_id}/goal` | 목표 설정/변경, `{goals: [{method, value, unit}, ...]}` | 필요 (본인만) |

- 목표는 수단(`method`)별로 여러 개 설정 가능 (예: 인강 30분, 문제집 10페이지). 요청 시 목표 리스트 전체를 통째로 교체한다(부분 수정 아님).
- 목표를 변경해도 과거 기록의 달성률에는 영향 없음 — 기록 시점의 목표가 `Entries.goal_snapshot`에 스냅샷으로 저장되어 있기 때문.
- `GET /users/{user_id}/goal`은 목표를 아직 설정하지 않은 유저에 대해 `null`을 그대로 반환한다(빈 배열이 아님) — 프론트는 `g ?? []`로 처리한다.

## 개인 학습 이력
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/entries/{user_id}?from=&to=` | 기간 내 기록 목록 | 필요 (로그인한 참가자면 누구나 — 본인 여부 무관) |
| GET | `/entries/{user_id}/{date}` | 특정 날짜 기록 단건 조회 | 필요 (로그인한 참가자면 누구나 — 본인 여부 무관) |
| PUT | `/entries/{user_id}/{date}` | 기록 생성/수정 (upsert) | 필요 (본인만) |
| DELETE | `/entries/{user_id}/{date}` | 기록 삭제 | 필요 (본인만) |

- 두 GET 엔드포인트는 `require_participant`만 검사한다(`require_participant_self`가 아님) — 다른 사람의 `user_id`로도 조회 가능(공유 목적), 토큰이 유효한 참가자의 것이기만 하면 된다. 쓰기(PUT/DELETE)는 토큰의 `user_id`와 경로의 `user_id`가 일치할 때만 허용.
- `PUT /entries/{user_id}/{date}` 요청 바디: `{study_items: [{method, topics, amount}, ...], notes}`. 하루에 여러 학습 수단을 각각 다른 내용/학습량으로 기록할 수 있다 (예: 인강으로 문법·청해 30분, 문제집으로 어휘 5페이지). 달성률(%)은 클라이언트가 보내지 않으며, 서버가 저장 시점의 `daily_goal`을 `goal_snapshot`으로 복사해 함께 저장한다.
- `PUT /entries/{user_id}/{date}`는 활성 시즌(`is_current=true`)이 없으면 `400`을 반환한다 — 기록 저장 시 `season_id`를 자동으로 채워야 하는데 채울 시즌이 없기 때문.

## 오프라인 모임
실제 모임이 열린 날짜를 등록하면 그 날짜들을 기준으로 회차가 자동으로 매겨진다. 격주처럼 고정 간격을 가정하지 않는다 — 모임이 매번 정확히 2주 간격이 아닐 수 있어서, 실제 등록된 날짜를 그대로 anchor로 쓴다. **등록/수정은 관리자 전용이 아니라 참가자 누구나 가능**하지만, **삭제는 등록한 본인만** 가능하다 — 시즌/계정 관리와 달리 모임 일정 조율은 그룹 구성원 전체가 실시간으로 정정할 수 있어야 실용적이지만, 삭제는 다른 사람의 등록을 실수로/의도적으로 지우는 사고를 막기 위해 등록자 확인이 필요하다고 판단.

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/meetings` | 등록된 모임 목록 (날짜순, 과거/예정 모두 포함) | 불필요 |
| POST | `/meetings` | 모임 등록 `{date, memo}` | 필요 (참가자, 본인 확인 없이 누구나) |
| PUT | `/meetings/{meeting_id}` | 모임 수정 `{date, memo}` | 필요 (참가자, 누구나) |
| DELETE | `/meetings/{meeting_id}` | 모임 삭제 | 필요 (참가자, **등록한 본인만** — 403 반환) |
| GET | `/dashboard/meetings` | 회차별 요약 목록 (지난 모임만, 회차마다 참가자별 집계 + 그 모임의 메모) | 불필요 |

- `/dashboard/meetings`는 활성 시즌이 없으면 `400`을 반환한다 — 회차 구간 계산에 시즌 시작일(anchor)이 필요하기 때문.

- 회차 구간: 1회차는 "현재 시즌 시작일 ~ 1회차 모임 날짜", 이후 회차는 "직전 회차 모임 다음날 ~ 이번 회차 모임 날짜".
- **`/dashboard/meetings`는 오늘(KST) 이후 날짜의 모임을 회차 집계에서 제외한다** — 아직 열리지 않은 모임을 이미 끝난 회차처럼 보여주지 않기 위함. 아직 지나지 않은 모임을 확인하려면 `/meetings`로 전체 목록을 조회한 뒤 클라이언트에서 오늘 이후 날짜만 걸러 "예정된 모임"으로 별도 표시한다(집계 없이 날짜/메모만).
- 모임을 아직 하나도 등록하지 않았으면(또는 전부 미래 날짜면) `/dashboard/meetings`는 빈 배열을 반환한다.
- 모임 등록/수정은 `require_participant`만 검사한다(`require_participant_self`가 아님) — 토큰의 `user_id`와 무관하게 로그인한 참가자 누구나 가능. 삭제는 추가로 해당 모임의 `created_by`와 토큰의 `user_id`가 일치하는지 검사하고, 다르면 403(forbidden)을 반환한다.

### `/dashboard/meetings` 응답 예시
```json
[
  {
    "round": 1,
    "meeting_id": "a1b2c3d4e5f6",
    "created_by": "u1",
    "range": {"from": "2026-07-01", "to": "2026-07-20"},
    "memo": "N2 문법 총정리",
    "participants": [
      {"user_id": "u1", "display_name": "A", "entry_count": 5, "achievement_rate": 82}
    ],
    "not_participated": ["u2"]
  }
]
```
- `created_by`는 삭제 버튼을 등록자 본인에게만 보여주기 위해 프론트에서 사용하고, 화면에 노출하지는 않는다.

## 대시보드 / 그룹 뷰
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/dashboard/weekly?week=2026-W03` | 해당 주 전체 유저 활동량 요약 (기록 건수, 미수행자 목록 등) | 불필요 (그룹 내부 공유용) |
| GET | `/dashboard/monthly?month=2026-07` | 월간 요약 | 불필요 |
| GET | `/dashboard/feed?from=&to=` | 기간 내 `notes` 공유 피드 (최신순) | 불필요 |

- 위 대시보드 엔드포인트는 모두 `status="active"`인 유저만 집계 대상으로 포함한다.

### `/dashboard/weekly` 응답 예시
```json
{
  "week": "2026-W03",
  "range": {"from": "2026-07-13", "to": "2026-07-19"},
  "participants": [
    {"user_id": "u1", "display_name": "A", "entry_count": 5, "achievement_rate": 82},
    {"user_id": "u2", "display_name": "B", "entry_count": 0, "achievement_rate": null}
  ],
  "not_participated": ["u2"]
}
```
- `achievement_rate`는 해당 기간 참가자 개인의 평균 달성률(%) — 계산 가능한(단위 일치) 기록이 없으면 `null`. **그룹 전체를 하나로 합산한 평균이 아니라 참가자별 개별 수치**라는 점에 유의(그룹 합산 금지 원칙과 상충하지 않음).

## 비고
- 인증이 "불필요"로 표시된 GET 엔드포인트는 그룹 내부 전용(URL 자체가 비공개 배포)이라는 전제. 외부 공개 시에는 최소한 그룹 공용 접근키 정도는 추가 검토 필요.
- 쓰기 API(PUT/DELETE)만 토큰 검사를 강제해 "실수로 타인 기록을 건드리는 것"을 방지하는 데 집중하고, 조회는 그룹 취지(공유)에 맞게 개방한다.
