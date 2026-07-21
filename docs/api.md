# API 엔드포인트

Base path: `/api` (API Gateway → Lambda, Python). 인증이 필요한 엔드포인트는 `Authorization: Bearer <token>` 헤더 필요 (로그인 시 발급되는 단기 서명 토큰, 정식 세션 관리 아님).

## 인증
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/users` | 사용자 선택 드롭다운용 목록 (`user_id`, `display_name`만 반환, PIN 정보 없음) | 불필요 |
| POST | `/auth/verify` | `{user_id, pin}` → PIN 검증, 성공 시 단기 토큰 발급 | 불필요 |

## 개인 학습 이력
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/entries/{user_id}?from=&to=` | 기간 내 본인 기록 목록 | 필요 (본인만) |
| GET | `/entries/{user_id}/{date}` | 특정 날짜 기록 단건 조회 | 필요 (본인만) |
| PUT | `/entries/{user_id}/{date}` | 기록 생성/수정 (upsert) | 필요 (본인만) |
| DELETE | `/entries/{user_id}/{date}` | 기록 삭제 | 필요 (본인만) |

- 다른 사람의 `user_id`로는 조회는 가능(공유 목적)하되, 쓰기(PUT/DELETE)는 토큰의 `user_id`와 경로의 `user_id`가 일치할 때만 허용.

## 대시보드 / 그룹 뷰
| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/dashboard/weekly?week=2026-W03` | 해당 주 전체 유저 활동량 요약 (기록 건수, 미수행자 목록 등) | 불필요 (그룹 내부 공유용) |
| GET | `/dashboard/biweekly?start=2026-07-06` | 격주 요약 (anchor 기준) | 불필요 |
| GET | `/dashboard/monthly?month=2026-07` | 월간 요약 | 불필요 |
| GET | `/dashboard/feed?from=&to=` | 기간 내 `notes` 공유 피드 (최신순) | 불필요 |

### `/dashboard/weekly` 응답 예시
```json
{
  "week": "2026-W03",
  "range": {"from": "2026-07-13", "to": "2026-07-19"},
  "participants": [
    {"user_id": "u1", "display_name": "A", "entry_count": 5, "goal_achieved_count": 4},
    {"user_id": "u2", "display_name": "B", "entry_count": 0, "goal_achieved_count": 0}
  ],
  "not_participated": ["u2"]
}
```

## 비고
- 인증이 "불필요"로 표시된 GET 엔드포인트는 그룹 내부 전용(URL 자체가 비공개 배포)이라는 전제. 외부 공개 시에는 최소한 그룹 공용 접근키 정도는 추가 검토 필요.
- 쓰기 API(PUT/DELETE)만 토큰 검사를 강제해 "실수로 타인 기록을 건드리는 것"을 방지하는 데 집중하고, 조회는 그룹 취지(공유)에 맞게 개방한다.
