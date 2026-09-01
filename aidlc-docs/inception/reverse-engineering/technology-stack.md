# Technology Stack

## Programming Languages
- Python — 3.12 (`serverless.yml:7` `runtime: python3.12`, CI `actions/setup-python@v5` `python-version: '3.12'`) — 전체 백엔드(Lambda 핸들러/도메인/리포지토리).
- TypeScript — `^5.5.3` (`frontend/package.json`) — 전체 프론트엔드(React SPA, strict 타입 사용, `tsc && vite build`로 빌드 시 타입체크 강제).
- YAML — Serverless Framework(`serverless.yml`) 및 GitHub Actions(`deploy.yml`) 설정 언어.

## Frameworks
- React — `^18.3.1` — SPA UI 프레임워크, 함수형 컴포넌트 + hooks(`useState`/`useEffect`)만 사용, 클래스 컴포넌트 없음.
- react-router-dom — `^6.26.0` — 클라이언트 사이드 라우팅(`BrowserRouter`, `Routes`/`Route`, `Navigate`).
- Serverless Framework — `^3.39.0` — AWS Lambda/API Gateway/DynamoDB/S3/CloudFront를 CloudFormation으로 오케스트레이션하는 IaC 프레임워크. v3는 유지보수 모드(v4부터 유료 라이선스 체계로 전환)이므로 향후 업그레이드 검토 시 라이선스 영향 확인 필요.
- 상태관리 라이브러리: 없음(의도적) — Redux/Zustand 등 미도입, React 기본 상태 + `fetch`로 충분하다는 `frontend/CLAUDE.md` 원칙을 실제로 지킴.

## Infrastructure
- AWS Lambda — Python 3.12 런타임, `memorySize: 256`, `timeout: 10`초, 함수 21개.
- Amazon API Gateway (HTTP API, payload v2) — `httpApi.cors: true`로 전체 라우팅.
- Amazon DynamoDB — PAY_PER_REQUEST 과금, 테이블 6개(Users/Admin/Seasons/Entries/Config/Meetings) + GSI 1개(`Entries.ByDate`).
- Amazon S3 — 프론트엔드 정적 빌드 호스팅(Public Access 전면 차단, CloudFront OAC로만 접근).
- Amazon CloudFront — OAC(Origin Access Control) 기반 배포, SPA를 위한 403/404→`/index.html` 리라이트, `CachingOptimized` 관리형 캐시 정책.
- AWS IAM — 콘솔용 관리자 IAM과 GitHub Actions 배포용 IAM(`s3_admin`) 별도 생성, 둘 다 현재 `AdministratorAccess`(최소 권한 원칙 미적용 상태, 추후 과제로 명시).
- 리전: `ap-northeast-2`(서울) 고정.

## Build Tools
- Vite — `^5.4.0` — 프론트엔드 개발 서버 및 프로덕션 번들러.
- @vitejs/plugin-react — `^4.3.1` — Vite의 React Fast Refresh/JSX 처리 플러그인.
- pip — 버전 미고정 CLI 자체(요구사항 파일만 버전 고정) — 백엔드 의존성 설치, CI에서 `--platform manylinux2014_x86_64 --python-version 3.12 --only-binary=:all: -t .`로 리포 루트에 직접 설치(Lambda 패키징 루트와 일치시키기 위함).
- npm — Node 20(`actions/setup-node@v4` `node-version: '20'`) — frontend/infra 의존성 설치.
- GitHub Actions — CI/CD 오케스트레이션(`actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-python@v5`, `aws-actions/configure-aws-credentials@v4`).

## Testing Tools
- pytest (암묵적 — `backend/tests/`가 pytest 스타일 함수 기반 테스트로 작성되어 있으나, **`backend/requirements.txt`에 pytest 자체가 명시돼 있지 않고, `pytest.ini`/`pyproject.toml`/`setup.cfg` 등 설정 파일도 리포에 존재하지 않는다** — 테스트 실행 방법이 문서화/고정되어 있지 않은 상태). CI 파이프라인(`deploy.yml`)에도 테스트 실행 스텝이 전혀 없음 — 유닛 테스트가 존재하지만 배포 게이트로 쓰이지 않는다.
- 프론트엔드 테스트 러너: 없음(Vitest/Jest/React Testing Library 등 미설치, 테스트 파일도 없음).
- Lint/Format: 없음 — ESLint/Prettier/Ruff/Black/flake8 설정 파일이 프로젝트 어디에도 없음(`frontend/package.json`에 lint 스크립트 없음, Python 쪽도 동일).
