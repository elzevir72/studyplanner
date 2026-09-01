# Requirements — 고도화 1차 배치 (drift 해소 / 디자인 재작업 / 기능 점검·보완)

## Intent Analysis Summary

- **User Request**: "achievement.ts/py drift 해소" + "디자인적으로 투박한 것을 버리고 싶다" + "이미 구현된 기능에 대해 부족한 점 체크·수정" — 3개 요청을 하나의 요구사항 분석 배치로 통합 진행 (Q4-1 확정)
- **Request Type**: Bug Fix(로직 drift) + Enhancement(디자인) + Refactoring(문서/코드 정합성) 혼합
- **Scope Estimate**: Multiple Components — `frontend/src/` 전반(모든 페이지·신규 컴포넌트 디렉토리), `backend/` 일부(신규 admin 엔드포인트 1개, achievement 로직 미세 수정 없음 — TS만 수정), `docs/`·`infra/CLAUDE.md` 문서
- **Complexity Estimate**: Moderate — 개별 항목은 각각 단순하지만 프론트 아키텍처 재설계가 전 화면에 영향을 주어 총 변경량이 큼
- **Depth**: Standard (구현 배치가 복잡하지만 이해관계자는 사용자 1인, 위험도는 낮은 도구)

---

## 1. Functional Requirements

### FR-1. achievement.ts / achievement.py drift 해소
- `frontend/src/achievement.ts`의 `calcEntryAchievementRate`에 `backend/domain/achievement.py:47`과 동일한 가드를 추가한다: 목표(`goal_snapshot`)의 해당 수단에 기록(`amount`)이 없을 때 0%로 평균에 포함하는 것은 **`goal.unit`이 존재할 때만** 수행한다.
- 백엔드 로직은 변경하지 않는다(이미 올바름). TS만 Python 기준으로 맞춘다.
- 이번 배치에서는 공유 테스트 fixture/러너 도입은 하지 않는다(범위 제외 — Q1-1 결정, 별도 후속 작업 후보로 남김).

### FR-2. 프론트엔드 디자인 전면 재작업
- **범위**: CSS 토큰·스타일 전면 재작성 + **프론트 아키텍처(공용 컴포넌트) 재설계** (Q2-1 최종 결정)
- **톤앤매너**: 기획자 의견 채택(Q2-2) — 기존 차분한 파스텔 톤은 유지하되, "카드형 + 여백 넉넉"한 습관관리 앱 스타일의 정돈된 인상으로 재정비. JLPT 스터디 목적에 맞게 화려하지 않게, 정체성을 위한 최소한의 브랜딩 포인트(파비콘/제목 영역 포인트 등)를 추가한다.
- **공용 컴포넌트** (`frontend/src/components/`에 신규 작성, Q2-1 후속 확정):
  - `Button` — primary/secondary variant, 기존 `.tag-btn`·`.secondary`·기본 버튼 스타일 통합
  - `Card` — `.card`/`.study-item-block` 등 박스형 컨테이너 통합
  - `FormField` — `label` + `input`/`select`/`textarea` 조합 통합
  - `TagSelect` — 학습 수단/학습 내용 선택에 쓰이는 토글형 태그 버튼 그룹
  - `Message` — 에러/힌트/성공 메시지 표시 통합
  - `Accordion` — `<details>` 기반 아코디언(오프라인 모임 회차, 목표 설정 등)을 상태 관리 포함한 컴포넌트로 통합
  - `LoadingPlaceholder` — "불러오는 중..." 등 로딩 상태 표시 통일
  - **범위 밖**: 라우팅(`App.tsx`의 react-router 구성), 전역 상태 관리 방식(React 기본 state 유지, Redux 등 도입 금지 — 기존 원칙 유지)은 손대지 않는다.
- **레이아웃 개선 대상** (Reverse Engineering + 실제 미리보기로 확인된 구체 문제):
  - 로그인 화면(`LoginPage.tsx`)·관리자 로그인 화면(`AdminPage.tsx`의 `LoginForm`): 데스크탑에서 카드 폭 대비 내용이 빈약해 여백만 과도한 문제 해소. `AdminPage.tsx`에도 `.login-shell` 상당의 좁은 폭 처리를 적용한다.
  - 카드/버튼/폼 요소의 시각적 밀도를 통일하지 않고, 정보 위계(제목/부제/본문/보조텍스트)가 드러나도록 타이포그래피 스케일을 정리한다.
- 4개 화면(로그인, 개인 기록, 대시보드, 관리자)의 기존 정보 구조·기능 동작은 변경하지 않는다 — 이번 배치는 시각적/구조적 재작업이며 기능 변경은 FR-4로 별도 처리한다.

### FR-3. 관리자 화면 — 참가자 선택 드롭다운화
- `AdminPage.tsx`의 `CreateUserForm`과 `UpdateUserStatusForm`에서 `user_id`를 raw text input으로 직접 입력하는 방식을 드롭다운 선택형으로 교체한다 (Q2-3).
- `CreateUserForm`: 신규 계정 생성 폼이므로 `user_id` 자체는 여전히 신규 입력(텍스트)이 맞다 — 이 폼은 드롭다운 대상이 아님. *(주의: 원 논의는 "참가자 상태 변경 폼"의 문제였음 — 아래 명확화)*
- `UpdateUserStatusForm`: 상태를 변경할 **기존 참가자**를 드롭다운에서 선택하도록 변경한다. `active`/`inactive` 양쪽 모두 선택 가능해야 하므로(비활성 계정을 다시 활성화하는 흐름을 지원해야 함), 기존 공개 `GET /users`(active만 반환)가 아니라 **신규 관리자 전용 엔드포인트**를 사용한다.
  - 백엔드: `GET /admin/users` 신규 추가, `require_admin`으로 보호, `users_repo.list_all_users()`(이미 존재)를 사용해 전체 참가자(active+inactive) 목록 반환.
  - 프론트: `AdminPage.tsx`에 관리자 토큰으로 이 엔드포인트를 호출해 드롭다운을 채운다.

### FR-4. 문서 정합성 정정 (Q3-1: A, C 확정)
- `docs/api.md` 수정:
  - `GET /entries/{user_id}` 인가 설명을 "본인만" → 실제 동작(`require_participant`만, 다른 참가자 데이터도 조회 가능)에 맞게 정정
  - `PUT /entries/{user_id}/{date}`, `GET /dashboard/meetings`가 활성 시즌이 없을 때 `400`을 반환하는 동작 문서화
  - `GET /users/{user_id}/goal`이 목표 미설정 시 `null`을 반환하는 동작 문서화
- `infra/CLAUDE.md`의 Lambda 함수 개수 표기를 23개 → 실제 값(신규 `/admin/users` 엔드포인트 추가로 개수가 다시 바뀌므로, 이번 변경 반영 후 최종 개수로) 정정
- 루트 `CLAUDE.md`의 커밋 `70d32cb` 관련 서술이 실제 diff 방향과 반대로 기록된 부분(Reverse Engineering에서 발견)도 함께 바로잡는다 — 실제로는 `responses.ok(None)`이 이미 `null`을 올바르게 반환하고 있음을 명확히 한다.

### FR-5. `Config` 테이블 정리 (Q3-1: B 확정)
- `infra/serverless.yml`(리포 루트)에서 미사용 `ConfigTable` 정의 및 관련 IAM 권한 제거
- `docs/data-model.md`에서 `Config` 테이블 문서 제거 (또는 "ADR 8로 폐기됨" 명시 후 제거)
- **주의**: `serverless.yml`은 과거 여러 배포 장애의 근원이었던 파일이므로(YAML 문법, 서비스 루트 경로 문제 등 — CLAUDE.md 진행상황 기록 참고), 이 변경은 반드시 별도 커밋으로 분리하고 배포 후 스택 정상 여부를 확인한다 (FR-3의 신규 엔드포인트 추가와 함께 배포되므로 더욱 주의 필요).

---

## 2. Non-Functional Requirements

- **NF-1 (호환성)**: FR-2의 컴포넌트 재설계는 기존 API 계약(`frontend/src/api/client.ts`)과 라우팅 구조를 변경하지 않는다 — 순수 프레젠테이션 계층 리팩터링.
- **NF-2 (일관성)**: 공용 컴포넌트 도입 후, 4개 페이지 전체가 새 컴포넌트를 사용하도록 전환한다 — 일부만 전환하고 나머지는 기존 마크업으로 남기지 않는다(반쪽짜리 리팩터가 오히려 일관성을 해치므로).
- **NF-3 (원칙 준수)**: 이 프로젝트의 기존 원칙(모바일 우선 반응형, 그룹 합산 집계 금지, 압박감 없는 톤, Redux 등 상태관리 라이브러리 도입 금지)은 이번 재작업에서도 그대로 유지한다.
- **NF-4 (배포 안정성)**: FR-5(`serverless.yml` 변경)는 FR-3(신규 엔드포인트)과 물리적으로 같은 파일을 건드리므로, Construction 단계 커밋 분리 시에도 이 둘의 배포 순서/영향 범위를 명확히 구분해 기술한다.
- **NF-5 (커밋 분리)**: Construction 단계 구현은 논리 단위로 커밋을 분리한다 (Q4-1 최종 결정): 최소 (1) achievement drift 수정, (2) 디자인/컴포넌트 재작업, (3) 관리자 드롭다운+신규 엔드포인트, (4) 문서 정정, (5) Config 테이블 제거 — 총 5개 내외로 나누는 것을 기본으로 하되 실제 구현 시 자연스러운 경계에 맞게 조정 가능.

---

## 3. Out of Scope (이번 배치에서 명시적으로 제외)

- 백엔드 `achievement.py` 로직 변경 (이미 올바름, TS만 수정)
- 프론트 테스트 러너/공유 fixture 테스트 도입 (Q1-1에서 별도 작업으로 분리 결정)
- CORS 제한, N+1 쿼리 개선, repos/handlers 유닛테스트 추가 등 Reverse Engineering에서 발견된 인프라·코드품질 이슈(Config 테이블 제외) — 사용자가 이번 요청 범위에 포함하지 않음
- 라우팅 구조, 전역 상태관리 방식 변경
- CreateUserForm의 `user_id` 입력 방식 변경 (신규 생성이므로 드롭다운 대상 아님 — FR-3 참고)

---

## 4. Key Decisions Log (질문-답변 요약)

| 항목 | 결정 | 근거 |
|---|---|---|
| Q1-1 drift 해소 | A (가드만 추가) | 낮은 리스크, 빠른 해결. 테스트 인프라 구축은 별도 작업 |
| Q2-1 디자인 범위 | C, 후속 확정: CSS + 프론트 아키텍처(공용 컴포넌트) | 사용자가 "지금이 구조 잡기 좋은 타이밍"이라 판단 |
| Q2-2 스타일 참고 | 기획자 의견(습관관리 앱 톤, 차분+정돈) | 사용자 채택 |
| Q2-3 관리자 드롭다운 | 포함, 전체(active+inactive) 대상 | 노출 위험 없음을 확인했으나 대신 비활성 계정 재활성화 불가 문제를 발견해 전체 목록으로 확정 |
| Q3-1 기능 점검 범위 | A, C 우선 + B(Config 테이블 제거)도 포함 | 사용자가 페르소나 추천(B 보류)보다 넓은 범위로 결정 |
| Q4-1 진행 방식 | 한 번에 진행, 커밋은 분리 | PM/기획자 의견(통합 진행) + 개발자 의견(커밋 분리) 절충 채택 |

전체 질문/답변 원문은 [requirement-verification-questions.md](requirement-verification-questions.md) 참고.
