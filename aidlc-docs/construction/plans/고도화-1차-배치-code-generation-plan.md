# Code Generation Plan — 고도화 1차 배치

**Unit**: 고도화 1차 배치 (단일 unit, Units Generation 생략)
**Workspace Root**: `C:\Users\db400tea\IdeaProjects\studyplanner` (aidlc-state.md 기준)
**Project Type**: Brownfield — 기존 파일은 in-place 수정, 신규 파일만 새로 생성. `_modified`/`_new` 등 접미사 파일 생성 금지.

## 근거 문서
- [requirements.md](../../inception/requirements/requirements.md) — FR-1~5
- [application-design.md](../../inception/application-design/application-design.md) — 컴포넌트/엔드포인트 경계
- [functional-design/*.md](../고도화-1차-배치/functional-design/) — 상태/상호작용 상세

## NF-5(커밋 분리) 매핑
이 계획의 5개 그룹은 각각 독립된 커밋 단위로 만들 것을 전제로 순서를 잡았습니다 — 그룹 사이에 서로 의존성이 없어 순서 자체를 바꿔도 무방하나, 배포 리스크가 있는 그룹(5)을 마지막에 배치했습니다.

---

## Step 1 — achievement drift 해소 (FR-1) ✅ 완료
- [x] 1.1 `frontend/src/achievement.ts`의 `calcEntryAchievementRate`에 `goal.unit` 존재 가드 추가 (business-logic-model.md 스니펫 그대로 반영)
- [x] 1.2 Business Logic Summary: 변경 요약 1줄 문서화 (`aidlc-docs/construction/고도화-1차-배치/code/step1-summary.md`)

*(백엔드 변경 없음 — `backend/domain/achievement.py`는 이미 올바름)*

## Step 2 — 프론트 공용 컴포넌트 7종 생성 (FR-2 일부) ✅ 완료
- [x] 2.1 `frontend/src/components/Button.tsx` 생성
- [x] 2.2 `frontend/src/components/Card.tsx` 생성 (`variant` prop 포함)
- [x] 2.3 `frontend/src/components/FormField.tsx` 생성
- [x] 2.4 `frontend/src/components/TagSelect.tsx` 생성 (`multiple` prop, 재클릭 해제 로직 포함)
- [x] 2.5 `frontend/src/components/Message.tsx` 생성
- [x] 2.6 `frontend/src/components/Accordion.tsx` 생성 (제어/비제어 겸용)
- [x] 2.7 `frontend/src/components/LoadingPlaceholder.tsx` 생성
- [x] 2.8 Frontend Components Summary 문서화

## Step 3 — 디자인 톤 재작업 + 4개 페이지 컴포넌트 전환 (FR-2 나머지) ✅ 완료
- [x] 3.1 `frontend/src/styles.css` 전면 재작성 — 기획자 톤(차분+정돈, 습관관리 앱 스타일) 반영, 신규 컴포넌트용 클래스 정리, 로그인/관리자 화면 여백 불균형 해소
- [x] 3.2 `frontend/src/pages/LoginPage.tsx` — Button/FormField/Message로 전환
- [x] 3.3 `frontend/src/pages/EntryPage.tsx` — 전체 컴포넌트로 전환, TagSelect 재클릭 해제에 따른 amount 리셋 로직 반영
- [x] 3.4 `frontend/src/pages/DashboardPage.tsx` — Button/FormField/Message/Accordion(제어형, openRound 상호배타)/LoadingPlaceholder로 전환
- [x] 3.5 `frontend/src/pages/AdminPage.tsx` — Button/Card/FormField/Message로 전환 (드롭다운 로직은 Step 4에서 처리)
- [x] 3.6 파비콘/제목 영역 브랜딩 포인트 추가
- [x] 3.7 Frontend Components Summary 갱신 (실제 적용 결과) — 검증(tsc, dev server, 브라우저 클릭 테스트) 완료

## Step 4 — 관리자 드롭다운 + 신규 엔드포인트 (FR-3) ✅ 완료
- [x] 4.1 `backend/handlers/admin_handler.py`에 `list_all_users` 함수 추가
- [x] 4.2 신규 테스트 추가 여부 판단 — 기존 handlers 테스트 전무 관례를 벗어나지 않기로 결정, 추가 안 함(범위 밖)
- [x] 4.3 `serverless.yml`에 `GET /api/admin/users` 라우트 추가
- [x] 4.4 `frontend/src/types.ts`에 `AdminUserSummary` 인터페이스 추가
- [x] 4.5 `frontend/src/api/client.ts`에 `adminListAllUsers(token)` 함수 추가
- [x] 4.6 `frontend/src/pages/AdminPage.tsx`의 `UpdateUserStatusForm`을 드롭다운으로 전환
- [x] 4.7 API Layer Summary 문서화 — 검증(py_compile, YAML 파싱, tsc, 브라우저) 완료

## Step 5 — 문서 정합성 정정 + Config 테이블 제거 (FR-4, FR-5) ✅ 완료
- [x] 5.1 `docs/api.md` — 인가 설명 정정, 400 응답 문서화, `goal` null 응답 문서화, 신규 admin 엔드포인트 문서화
- [x] 5.2 `infra/CLAUDE.md` — Lambda 함수 개수 정정 (26개)
- [x] 5.3 루트 `CLAUDE.md` — 커밋 `70d32cb` 서술 오류 정정 — 조사 결과 현재 파일에 해당 서술 없음, 실제로는 git 커밋 메시지 자체를 가리킨 것으로 판단되어 스킵(상세: step5-summary.md)
- [x] 5.4 `serverless.yml` — `ConfigTable` 정의, `CONFIG_TABLE` 환경변수, IAM Resource의 `ConfigTable.Arn` 3곳 제거
- [x] 5.5 `docs/data-model.md` — `Config` 테이블 문서 제거 (+ architecture.md ADR 8에 각주 추가)
- [x] 5.6 Documentation Generation Summary — YAML 재검증, grep 재확인 완료

---

## 커밋 분리 가이드 (NF-5, 구현 시 참고용 — 이 계획 자체의 실행 순서는 위 Step 순서를 따름)
1. Step 1 (achievement drift)
2. Step 2+3 (공용 컴포넌트 + 디자인 재작업) — 서로 강하게 연결되어 있어 하나의 커밋으로 묶어도 무방
3. Step 4 (관리자 드롭다운 + 신규 엔드포인트) — `serverless.yml` 변경 포함, 배포 검증 필요
4. Step 5 (문서 정정 + Config 테이블 제거) — `serverless.yml` 재변경 포함, Step 4 배포 확인 후 별도로 진행 권장 (services.md에서 이미 지적한 배포 리스크 분리 원칙)

## Deployment Artifacts
- Step 4, Step 5는 `serverless.yml` 변경을 포함하므로 `main` 브랜치 push 시 GitHub Actions가 자동 배포함 — 각 Step 완료 후 배포 결과를 실제로 확인하는 것은 Build & Test 단계 이후, 사용자가 커밋/푸시를 승인한 시점에 진행.
