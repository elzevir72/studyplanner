# API 엔드포인트

Base path: `/api` (API Gateway → Lambda, Python). 인증이 필요한 엔드포인트는 `Authorization: Bearer <token>` 헤더 필요 (로그인 시 발급되는 단기 서명 토큰, 정식 세션 관리 아님).

## 인증
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/users` | 사용자 선택 드롭다운용 목록 (`user_id`, `display_name`만 반환, PIN 정보 없음). 기본적으로 `status="active"`인 유저만 반환 | 불필요 |
| POST | `/auth/verify` | `{user_id, pin}` → PIN 검증, 성공 시 단기 토큰 발급 | 불필요 |

- 탈퇴한 유저(`status="inactive"`)는 삭제되지 않고 데이터가 보존됨. 드롭다운/대시보드에는 안 보이지만 과거 기록 자체는 남아있음.

## 시즌
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/seasons` | 시즌 목록 (과거 포함) | 불필요 |
| GET | `/seasons/current` | 현재 진행 중인 시즌 정보 | 불필요 |
| GET | `/dashboard/season/{season_id}` | 해당 시즌 전체 요약 (참가자별 기록 수, 개인 달성률 추이) | 불필요 |

- 새로 생성되는 기록은 항상 현재 시즌(`/seasons/current`)에 자동 태깅됨 — 클라이언트가 시즌을 직접 선택하지 않음.
- 여러 스터디 그룹(다른 어학/자격증 등)이 생기는 경우, 이 리포지토리 안에서 그룹 개념을 나누지 않고 **그룹별로 별도 배포**한다 (별도 DynamoDB 테이블 + 별도 스택). 자세한 내용은 [docs/data-model.md](data-model.md) 참고.

## 목표 설정
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/users/{user_id}/goal` | 현재 목표(`daily_goal`) 조회 | 불필요 (공유 목적) |
| PUT | `/users/{user_id}/goal` | 목표 설정/변경, `{value, unit}` | 필요 (본인만) |

- 목표를 변경해도 과거 기록의 달성률에는 영향 없음 — 기록 시점의 목표가 `Entries.goal_snapshot`에 스냅샷으로 저장되어 있기 때문.

## 개인 학습 이력
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/entries/{user_id}?from=&to=` | 기간 내 본인 기록 목록 | 필요 (본인만) |
| GET | `/entries/{user_id}/{date}` | 특정 날짜 기록 단건 조회 | 필요 (본인만) |
| PUT | `/entries/{user_id}/{date}` | 기록 생성/수정 (upsert) | 필요 (본인만) |
| DELETE | `/entries/{user_id}/{date}` | 기록 삭제 | 필요 (본인만) |

- 다른 사람의 `user_id`로는 조회는 가능(공유 목적)하되, 쓰기(PUT/DELETE)는 토큰의 `user_id`와 경로의 `user_id`가 일치할 때만 허용.
- `PUT /entries/{user_id}/{date}` 요청 바디: `study_method`, `study_topic`, `amount`, `notes` 등. 달성률(%)은 클라이언트가 보내지 않으며, 서버가 저장 시점의 `daily_goal`을 `goal_snapshot`으로 복사해 함께 저장한다.

## 대시보드 / 그룹 뷰
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/dashboard/weekly?week=2026-W03` | 해당 주 전체 유저 활동량 요약 (기록 건수, 미수행자 목록 등) | 불필요 (그룹 내부 공유용) |
| GET | `/dashboard/biweekly?start=2026-07-06` | 격주 요약. `start` 미지정 시 현재 시즌의 anchor(`Seasons.start_date`) 기준 | 불필요 |
| GET | `/dashboard/monthly?month=2026-07` | 월간 요약 | 불필요 |
| GET | `/dashboard/feed?from=&to=` | 기간 내 `notes` 공유 피드 (최신순) | 불필요 |

- 위 대시보드 엔드포인트는 모두 `status="active"`인 유저만 집계 대상으로 포함한다.

### `/dashboard/weekly` 응답 예시
```json
{
  "week": "2026-W03",
  "range": {"from": "2026-07-13", "to": "2026-07-19"},
  "participants": [
    {"user_id": "u1", "display_name": "A", "entry_count": 5},
    {"user_id": "u2", "display_name": "B", "entry_count": 0}
  ],
  "not_participated": ["u2"]
}
```
- 그룹 대시보드에 개인별/평균 달성률(%)까지 노출할지는 **미정** — "성과 압박을 주지 않는다"는 원칙과 상충하는지 검토 후 별도 결정. 현재는 개인 화면에서만 달성률을 보여준다.

## 비고
- 인증이 "불필요"로 표시된 GET 엔드포인트는 그룹 내부 전용(URL 자체가 비공개 배포)이라는 전제. 외부 공개 시에는 최소한 그룹 공용 접근키 정도는 추가 검토 필요.
- 쓰기 API(PUT/DELETE)만 토큰 검사를 강제해 "실수로 타인 기록을 건드리는 것"을 방지하는 데 집중하고, 조회는 그룹 취지(공유)에 맞게 개방한다.
