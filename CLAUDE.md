# Study Planner — 루트 가이드

10명 이하 스터디 그룹용 학습 이력 기록/공유 도구. 상세 배경은 [README.md](README.md), 아키텍처 결정은 [docs/architecture.md](docs/architecture.md) 참고.

## AI-DLC 워크플로우 (2026-08-31부터 적용)

이 프로젝트는 프로토타입 단계를 지나 고도화 단계부터 [AI-DLC](https://github.com/awslabs/aidlc-workflows) 방법론을 적용한다. **사용자가 소프트웨어 개발 작업을 요청하면(기능 추가/버그 수정/리팩터링 등), [AI-DLC-WORKFLOW.md](AI-DLC-WORKFLOW.md)를 최우선으로 로드하고 그 워크플로우를 따른다** — 이 문서가 정의하는 Inception(요구사항/설계) → Construction(구현) → Operations(운영) 3단계와, 각 단계의 세부 규칙(`.aidlc-rule-details/`)을 지침에 따라 로드해서 사용한다.

- 이미 만들어진 이 프로젝트의 설계/구현 상태(아래 "진행 상황"과 각 하위 `CLAUDE.md`, `docs/`)는 AI-DLC 관점에서 "기존 코드베이스(brownfield)"로 취급한다 — 처음부터 다시 설계하지 않고, 이 문서들을 기존 컨텍스트로 활용한다.
- 워크플로우 산출물(요구사항, 설계, 감사 로그 등)은 `aidlc-docs/`에 생성한다. 이 프로젝트의 코드/문서 구조(`backend/`, `frontend/`, `infra/`, `docs/`, 루트 `CLAUDE.md` 등)는 그대로 유지하고, `aidlc-docs/`는 그 위에 추가되는 별도 레이어다.
- 원본 AI-DLC 배포본은 `aidlc-workflows-main/`에 참고용으로 보관한다(라이브 워크플로우 실행에는 `AI-DLC-WORKFLOW.md`와 `.aidlc-rule-details/`를 사용).
- 간단한 질문 답변이나 사소한 확인 요청까지 이 무거운 단계별 워크플로우를 강제하지는 않는다 — 워크플로우 자체가 "adaptive"하게 요청의 복잡도에 맞춰 단계를 건너뛰도록 설계되어 있으니 그 판단을 따른다.

---

## 진행 상황 (2026-07-23 기준)

**완료**
- [x] 요구사항 검토 및 스택/설계 결정 확정 (React+TS / Python Lambda / DynamoDB / Serverless Framework / PIN 인증 / CloudFront 기본 URL)
- [x] 설계 문서 작성 및 확장: `README.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/api.md` (목표/달성률, 시즌, 멤버 비활성화, 모바일 우선 등 기능 기획 반영)
- [x] 하위 디렉토리 `CLAUDE.md` 3종 작성 (backend/frontend/infra)
- [x] Sheets 프로토타입 생성 (참고용으로 보관, 라이브 실증에는 쓰지 않음): `prototype-sheets/`
- [x] GitHub 리포지토리 등록 완료: `https://github.com/elzevir72/studyplanner` (Public). `main`=검증된 상태, `dev`=개발 브랜치. **이제 GitHub이 프로젝트 source of truth.**
- [x] 기능 기획 1차 완료 — 목표 설정/달성률(%), 시즌(Season), 멤버 비활성화(status), 멀티그룹 대응 방식(별도 배포), 알림 제외, 모바일 우선. 상세 근거는 [docs/architecture.md](docs/architecture.md) ADR 5~11 참고.
- [x] 기능 기획 2차 완료 — 그룹 대시보드 참가자별 달성률 노출, 시험일 D-day 배너, 관리자 계정 분리 및 참가자 계정/시즌 운영 플로우. [docs/architecture.md](docs/architecture.md) ADR 12~14 참고.
- [x] **코드 스캐폴딩 완료** — `backend/`(Lambda 핸들러·도메인 로직·리포지토리·유닛테스트), `frontend/`(React+TS+Vite, 로그인/기록/대시보드/관리자 4개 화면), `infra/serverless.yml`(DynamoDB 5개 테이블 + Lambda 21개 + S3/CloudFront), `.github/workflows/deploy.yml`(GitHub Actions 자동 배포) 모두 구현됨.
- [x] AWS 배포 환경 확정 — Vercel/MariaDB 전환 제안은 기각, **기존 AWS 스택(Lambda+DynamoDB) 유지로 최종 결정**. 사유: Vercel 전환 시 DB 계층(DynamoDB→SQL) 전면 재작성이 필요해 재작업 비용이 크고, MariaDB를 RDS로 유지하면 AWS 계정 이슈가 그대로 남아 전환 실익이 없다고 판단.
- [x] AWS 계정 준비 — 사용자가 별도 AWS 계정 생성(루트 소유자 아님), 콘솔 로그인용 관리자 IAM 사용자 생성 (`AdministratorAccess` 그룹 연결), GitHub Actions 배포 전용 IAM 사용자(`s3_admin`, 액세스 키 발급, `AdministratorAccess` 재사용) 생성 완료.
- [x] GitHub Secrets 등록 완료 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `JWT_SECRET`).
- [x] `dev` → `main` 머지 및 최초 배포 성공 — DynamoDB 5개 테이블, S3, CloudFront, Lambda 21개, API Gateway 모두 생성 확인(CloudFormation 스택 `study-planner-prod`).
- [x] 프론트엔드 배포(S3 sync) 실패 수정 — `serverless info --verbose` 텍스트 파싱 방식이 깨져서 빈 버킷명으로 `aws s3 sync`가 실행되던 문제. CloudFormation 스택 아웃풋을 `aws cloudformation describe-stacks --query`로 직접 조회하는 방식으로 교체.
- [x] `infra/serverless.yml` YAML 문법 오류 수정 — `httpApi: { path: /api/users/{user_id}/pin, ... }`처럼 flow mapping 안에 따옴표 없는 경로를 쓰면 `{user_id}`의 중괄호가 새 flow mapping 시작으로 오인되어 파싱 실패. 모든 `path` 값에 따옴표 처리(21곳).
- [x] 관리자 계정(`Admin` 테이블) 생성 — `password_hash`는 bcrypt 해시로 저장(평문 아님). `seed_admin.py`는 대화형 프롬프트라 로컬 실행 대신 **AWS 콘솔 DynamoDB 항목 생성으로 수동 등록**(`admin_id`=`ADMIN`, `password_hash`=bcrypt 해시).

**미완료 / 다음에 이어갈 것**
- [ ] **`/admin` 로그인 500 에러 — 원인 파악, 수정 진행 중, 재배포 필요.** 실제 원인은 `serverless.yml`이 `infra/` 디렉토리 안에 있어서, Serverless Framework가 서비스 루트를 `infra/`로 잡고 핸들러 경로(`backend/handlers/...`, 리포 루트 기준)를 못 찾는 구조적 문제(`Runtime.ImportModuleError: No module named 'backend'`, CloudWatch 로그로 확인). `--config` 옵션으로 우회 시도했으나 Serverless Framework가 아예 지원하지 않아 실패(`Service configuration is expected to be placed in a root of a service`). **해결책으로 `serverless.yml`을 리포 루트로 이동**하고 `.github/workflows/deploy.yml`도 루트 기준 실행(`npx --prefix infra serverless deploy --stage prod`, working-directory 없이)으로 수정함 — 이 세션에서 커밋/푸시 완료 후 재배포 결과 확인 필요.
- [ ] 재배포 후 관리자 로그인(`adminsoochoo`) 및 이후 참가자 계정/시즌 생성 플로우 실제 동작 검증 필요.
- [ ] `s3_admin`이라는 이름의 배포용 IAM 사용자에 `AdministratorAccess`를 재사용 중 — 최소 권한 원칙상 나중에 여유 생기면 Serverless 배포에 필요한 서비스로만 좁히는 것을 고려(현재는 편의상 보류 상태).
- [ ] Node.js/npm, GitHub CLI(gh), winget 로컬 미설치 상태 (AWS CLI는 설치 확인됨, `s3_admin` 자격증명으로 configure됨 — 단, 이 로컬 자격증명은 배포 리소스 조회 권한이 부족해 프로젝트 리소스 확인에는 콘솔을 사용 중).
- [ ] 로컬 사용자가 리포지토리(`elzevir72/studyplanner`) Admin 권한이 아닌 Collaborator라 GitHub Settings 일부(Actions 활성화 여부 등)를 직접 확인/변경 불가 — 필요 시 리포 소유자(`elzevir72`)에게 요청 필요.

**다음 세션 시작 시 확인할 것 (우선순위 순):**
1. `serverless.yml` 루트 이동 커밋 이후 재배포 성공 여부, `/admin` 로그인 정상 동작 여부
2. 참가자 계정 생성 및 시즌 생성/활성화까지 관리자 플로우 실제 확인
3. 배포용 IAM(`s3_admin`) 권한을 최소 권한으로 좁힐지 여부 (선택 사항)

## 원칙
- 이 프로젝트는 **강제 관리 도구가 아니라 공유 촉진 도구**다. 기능을 추가할 때 "성과 압박"보다 "공유 편의"를 우선한다.
- 사용자는 10명 이하 소규모 지인 그룹(현재 실제 참가자 5명 내외, 일본어 JLPT 학습 스터디). 엔터프라이즈급 인증/권한 체계는 과설계다 — PIN 기반 최소 확인 이상으로 확장하지 않는다.
- 데이터 모델(학습 수단/내용/분량 태그)은 아직 기획 초기 단계로, [docs/data-model.md](docs/data-model.md)의 필드는 실사용 후 조정될 수 있다. 스키마 변경 시 마이그레이션 스크립트 없이도 대응 가능하도록 느슨한 구조를 유지한다.
- `amount.unit`은 사람/기록마다 다를 수 있으므로 **그룹 전체 합산 집계는 하지 않는다.** 집계는 "기록 존재 여부/빈도" 중심으로, `amount`는 개인별 추이 표시에만 사용한다.
- 목표(`daily_goal`)는 참가자별 자율 설정 — 그룹 공통 목표를 강제하지 않는다(가용 학습 시간 편차가 크고 참여가 불규칙적이라서). 달성률(%)은 `amount`/`goal_snapshot`(기록 시점 스냅샷) 기준으로 계산하며, 목표를 나중에 바꿔도 과거 기록에는 소급 반영하지 않는다.
- 인앱 댓글/리액션 기능은 넣지 않는다 — 오프라인 모임이 그 역할을 대체한다. `notes`는 그 모임의 사전 공유 자료로 취급.
- 멤버 탈퇴는 삭제가 아니라 `status=inactive` 전환. 데이터는 보존하고 대시보드/드롭다운에서만 제외.
- 학습 데이터는 시즌(`Seasons`) 단위로 구분한다 — 같은 급수를 여러 회차 재도전하는 경우를 지원.
- 대시보드의 "오프라인 모임" 뷰는 고정 간격(격주 등)을 가정하지 않는다. 실제 모임이 열린 날짜를 등록(`Meetings`)하면 그 날짜들을 기준으로 회차가 자동으로 매겨진다 — 실제 모임 주기가 불규칙할 수 있어서(밀리거나 당겨짐), 날짜 계산이 아니라 등록된 실제 날짜를 그대로 anchor로 쓴다. 아직 지나지 않은(오늘 이후) 모임은 회차 집계에서 제외하고 "예정된 모임"으로만 표시한다 — 안 열린 모임을 이미 끝난 회차처럼 보여주면 안 되므로.
- 모임 등록/수정은 시즌·계정 관리와 달리 **관리자 전용이 아니라 참가자 누구나** 할 수 있다 — 모임 일정은 그룹 구성원이 실시간으로 조율하는 게 더 실용적이라고 판단. 단 **삭제는 등록한 본인만** 가능 — 다른 사람이 실수로/의도적으로 남의 등록을 지우는 사고를 막기 위함.
- 다른 스터디 그룹 지원이 필요해지면 스키마 확장이 아니라 **그룹별 별도 배포**로 대응한다 (스테이지 분리 메커니즘 재사용).
- 리마인더/알림 기능은 넣지 않는다 (격주 모임으로 충분, 비용/복잡도 대비 실익 낮음). 단, 시험일 D-day 배너는 능동 알림이 아니라 접속 시 보이는 정보성 표시라 예외.
- 모바일 우선 반응형 웹으로 설계한다 (네이티브 앱 아님).
- 그룹 대시보드에는 참가자별 달성률(%)을 노출한다 — 그룹 합산이 아닌 개인별 수치이므로 "그룹 합산 금지" 원칙과 충돌하지 않는다.
- 관리자 계정은 참가자(`Users`)와 완전히 분리된 단일 계정(`Admin`)이다. 참가자 계정 생성/상태 변경, 시즌 생성/전환은 관리자 전용이며 `/admin` 별도 경로로만 접근한다.

## 하위 디렉토리
- [frontend/CLAUDE.md](frontend/CLAUDE.md)
- [backend/CLAUDE.md](backend/CLAUDE.md)
- [infra/CLAUDE.md](infra/CLAUDE.md)

## Git / 배포
- `main` = 검증된 최종 상태만 유지, 개발은 `dev` 브랜치에서 진행.
- 커밋/푸시/파일 삭제·이동은 사용자 승인 후에만 수행한다.
- `main` push 시 GitHub Actions가 Serverless Framework로 자동 배포.
