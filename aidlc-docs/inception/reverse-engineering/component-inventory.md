# Component Inventory

## Application Packages
- `backend` — Python Lambda API (핸들러 21개, 도메인 순수함수 4모듈, 리포지토리 5모듈, 공통 유틸 6모듈).
- `frontend` — React + TypeScript SPA (화면 4개, 컴포넌트 1개, API 클라이언트/인증/타입/달성률 유틸 각 1모듈).

## Infrastructure Packages
- `infra` — Serverless Framework(v3) devDependency 관리용 `package.json`만 보유. 실제 IaC 정의(`serverless.yml`)는 리포 루트에 위치(Serverless Framework 제약상 서비스 루트가 되어야 하므로).
- `.github/workflows/deploy.yml` — GitHub Actions CI/CD 파이프라인(2-job: deploy-backend → deploy-frontend).

## Shared Packages
- `backend/common` — 인증(JWT/bcrypt), 에러 처리 데코레이터, DB 접근 캐싱, 요청/응답 파싱, KST 시간 유틸. 6개 모듈.
- `backend/domain` — 순수 함수 계산 계층(달성률/대시보드 집계/D-day/기간 계산). 4개 모듈.
- `backend/repos` — DynamoDB 접근 계층(테이블당 1모듈). 5개 모듈.
- `frontend/src/api`, `frontend/src/auth.ts`, `frontend/src/types.ts`, `frontend/src/achievement.ts` — 프론트엔드 공용 유틸(REST 클라이언트, 세션 관리, 타입 정의, 달성률 미러 로직).

## Test Packages
- `backend/tests` — Unit 테스트만 존재, 4개 파일(achievement/dashboard/dday/periods), 총 19개 테스트 케이스. 대상은 전부 `backend/domain/*` 순수 함수뿐 — `backend/repos`, `backend/handlers`는 커버리지 0%.
- `frontend` — 테스트 패키지 없음. 테스트 러너(Vitest/Jest 등) 설치도, `*.test.ts(x)` 파일도 전혀 없음(node_modules 내 서드파티 패키지 자체 테스트 제외).
- Integration/Load 테스트: 없음. `prototype-sheets/`는 Google Sheets 프로토타입 산출물(참고용 보관, 라이브 코드 아님)이라 테스트 대상에서 제외.

## Total Count
- **Total Packages**: 3 (backend, frontend, infra) + 1 CI 파이프라인 정의(패키지는 아니지만 배포 구조상 별도 언급)
- **Application**: 2 (backend, frontend)
- **Infrastructure**: 1 (infra + 루트의 serverless.yml)
- **Shared**: backend 내 2개 계층(common, domain) + repos 1개 계층 = 3개 서브패키지, frontend 내 4개 공용 모듈
- **Test**: 1 (backend/tests, 4 파일 19 케이스) — frontend 테스트 0

### 세부 파일 개수
| 영역 | 개수 |
|---|---|
| Lambda 핸들러 함수 (serverless.yml `functions`) | 21 |
| DynamoDB 테이블 | 6 (Users, Admin, Seasons, Entries, Config, Meetings) — 이 중 **Config는 코드에서 미사용** |
| DynamoDB GSI | 1 (`Entries.ByDate`) |
| backend/handlers 파일 | 6 |
| backend/repos 파일 | 5 |
| backend/domain 파일 | 4 |
| backend/common 파일 | 6 |
| backend/tests 파일 | 4 (테스트 케이스 19개) |
| frontend/src/pages 파일 | 4 |
| frontend/src/components 파일 | 1 |
| frontend 공용 모듈 (api/auth/types/achievement) | 4 |
| frontend 테스트 파일 | 0 |
