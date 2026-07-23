# Infra — 가이드

Serverless Framework 기반 IaC. 아키텍처 배경은 [../docs/architecture.md](../docs/architecture.md) 참고.

## 원칙
- 리소스: API Gateway + Lambda(Python) + DynamoDB(`Users`, `Entries`, `Config`, `Seasons`, `Admin`) + S3(정적 호스팅) + CloudFront.
- 커스텀 도메인/Route53은 MVP에서 구성하지 않는다 (CloudFront 기본 URL 사용). 나중에 추가해도 기존 리소스 재설계 불필요.
- 배포는 GitHub Actions에서 `main` 브랜치 push 시 자동 실행. AWS 자격증명은 GitHub Secrets로 관리, 리포지토리에 절대 커밋하지 않는다.
- 리소스 이름에 스테이지(`dev`/`prod`) 접두사를 붙여 향후 스테이지 분리가 필요해지면 대응 가능하게 한다 (현재는 단일 스테이지로 충분).
- 여러 스터디 그룹을 지원해야 할 경우, 스키마에 손대지 않고 같은 스테이지 분리 메커니즘으로 그룹마다 완전히 별도 스택을 배포한다 (배경: [architecture.md](../docs/architecture.md) ADR 9).
- 관리자(`Admin`) 계정 초기 생성/비밀번호 재설정은 자동 배포 파이프라인에 넣지 않고, 배포 권한을 가진 사람이 로컬에서 수동 시딩 스크립트(`backend/scripts/seed_admin.py`)를 1회 실행하거나, 콘솔에서 DynamoDB `Admin` 테이블에 `admin_id`/`password_hash`(bcrypt 해시) 항목을 직접 생성하는 방식으로 처리한다(idempotent, 배경: [architecture.md](../docs/architecture.md) ADR 14). 플랫폼은 AWS 스택 유지로 확정됨(Vercel 전환 검토 후 기각).
- **`serverless.yml`은 반드시 리포지토리 루트에 위치해야 한다.** Serverless Framework는 `serverless.yml`이 있는 디렉토리를 서비스 루트로 삼아 모든 상대 경로(핸들러 경로, `package.patterns`)를 해석하며, `--config`로 다른 위치의 설정 파일을 가리키는 방식은 지원하지 않는다(`Service configuration is expected to be placed in a root of a service` 에러). 핸들러 경로(`backend/handlers/...`)가 리포 루트 기준이므로, `serverless.yml`을 `infra/` 밑에 두면 Lambda가 `backend` 모듈을 찾지 못해 `Runtime.ImportModuleError`가 난다 — 2026-07-23 실제 배포 장애로 확인됨.
- CI에서 Python 의존성(`bcrypt`, `PyJWT`, `boto3`)은 리포 루트에 직접 설치한다(`pip install -t .`). Lambda 패키징 루트와 일치시켜야 `sys.path`에 자동으로 잡힌다 — 별도 하위 폴더(`backend/vendor` 등)에 설치하면 import가 실패한다. `bcrypt`는 C 확장 포함 패키지라 `--platform manylinux2014_x86_64 --only-binary=:all:` 옵션으로 Lambda(Amazon Linux) 호환 바이너리를 강제해야 한다.
- `httpApi.path`에 경로 파라미터(`{user_id}` 등)가 들어가는 경우, YAML flow mapping(`{ path: ..., method: ... }`) 안에서는 값에 따옴표를 반드시 붙인다. 따옴표 없이 쓰면 중괄호가 중첩 flow mapping으로 오인되어 YAML 파싱이 실패한다.
- 배포 후 CloudFormation 스택 아웃풋(`FrontendBucketName`, `FrontendDistributionId`, `ApiUrl`)은 `serverless info --verbose`의 텍스트 출력을 파싱하지 않고, `aws cloudformation describe-stacks --query "Stacks[0].Outputs[?OutputKey=='...'].OutputValue" --output text`로 직접 조회한다 — 텍스트 파싱은 출력 포맷 변경에 취약해 실제 장애(빈 버킷명으로 `s3 sync` 실패)를 겪었다.

## 배포 파이프라인 구조
- `serverless.yml` (리포 루트) — DynamoDB 5개 테이블, Lambda 21개 함수, API Gateway HTTP API, S3+CloudFront(OAC) 정의.
- `infra/package.json` — `serverless` CLI만 devDependency로 관리(`infra/node_modules`에 설치). 실행 시 `npx --prefix infra serverless ...`로 리포 루트(cwd)에서 그 CLI 바이너리를 사용.
- `.github/workflows/deploy.yml` — `main` push 시 2단계 job(`deploy-backend` → `deploy-frontend`) 순차 실행. 백엔드 배포 후 CloudFormation 아웃풋을 읽어 프론트엔드 빌드(`VITE_API_URL`)와 S3 sync, CloudFront invalidation에 사용.

## AWS 계정 운영
- 배포 AWS 계정은 사용자 소유(루트 계정 아님, 별도 IAM으로 콘솔 접근). 콘솔용 관리자 IAM과 GitHub Actions 배포용 IAM(`s3_admin`)을 분리 생성, 둘 다 `AdministratorAccess` 그룹 연결 — 최소 권한으로 좁히는 건 추후 과제.
- GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`(배포용 IAM), `JWT_SECRET`(앱 자체 인증 서명 키, AWS와 무관한 랜덤 값).
