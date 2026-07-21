# Study Planner — 루트 가이드

10명 이하 스터디 그룹용 학습 이력 기록/공유 도구. 상세 배경은 [README.md](README.md), 아키텍처 결정은 [docs/architecture.md](docs/architecture.md) 참고.

## 진행 상황 (2026-07-20 기준)

**전략 재전환 (2026-07-20 같은 날 재변경):** Sheets 프로토타입은 실증용 라이브 트라이얼로 쓰지 않고 "참고용"으로만 남기기로 함 — 사용자가 Sheets 실증 단계를 건너뛰고 바로 AWS 실구현으로 가기로 결정. 또한 AWS 계정은 새로 만들지 않고 **같이 프로젝트를 공유하는 사람의 기존 AWS 환경을 쓸 가능성이 높음** — 계정/IAM 준비는 그 협업자와 조율이 필요해 사용자가 보류 중.

**완료**
- [x] 요구사항 검토 및 스택/설계 결정 확정 (React+TS / Python Lambda / DynamoDB / Serverless Framework / PIN 인증 / CloudFront 기본 URL)
- [x] 설계 문서 작성: `README.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/api.md`
- [x] 하위 디렉토리 `CLAUDE.md` 3종 작성 (backend/frontend/infra)
- [x] 소개용 아티팩트(웹페이지) 발행 — 다른 개발자에게 공유용, 비공개 링크. URL은 auto-memory `project_study_planner.md` 참고
- [x] Sheets 프로토타입 생성 (참고용으로 보관): `prototype-sheets/study_planner_prototype.xlsx` + `prototype-sheets/SETUP.md` — 라이브 실증에는 쓰지 않기로 함
- [x] 로컬 툴체인 점검 완료: git 2.54.0 / Python 3.13 설치돼 있음. **Node.js·npm, AWS CLI, GitHub CLI(gh)는 미설치** (Serverless Framework 구동에 Node.js 필요)

**미완료 / 다음 세션에서 이어갈 것**
- [ ] AWS 환경 확정 대기 — 사용자가 협업자의 기존 AWS 계정/IAM을 쓸지, 별도로 새로 만들지 아직 안 정해짐. **다음 세션 시작 시 이것부터 확인할 것**
- [ ] 협업자 AWS 환경을 쓰기로 하면: 배포 권한 범위(IAM), 리전, 계정 소유자와의 커뮤니케이션 방식 등 새로 조율 필요
- [ ] Node.js/npm, AWS CLI 로컬 설치 — 사용자 승인 대기 중 미설치 상태로 세션 종료됨
- [ ] git 저장소 초기화 — 로컬 `git init` 및 첫 커밋조차 아직 안 함. 사용자 승인 필요 (커밋/푸시 규칙은 아래 "Git / 배포" 참고)
- [ ] GitHub 원격 저장소 생성 여부/이름/공개범위 결정 안 됨
- [ ] 코드 스캐폴딩 전혀 시작 안 함 — `backend/`, `frontend/`, `infra/`는 CLAUDE.md만 있고 실제 코드 없음
- [ ] 데이터 모델 필드, 미수행자 판정 기준은 기획 확정이 아니라 실사용 후 조정 예정인 "잠정안"임을 유의 — 이제 실사용 데이터 없이 실구현으로 들어가는 셈이므로, 구현 중 조정 가능성이 오히려 더 높음

**다음 세션 시작 시 확인할 것 (우선순위 순):**
1. AWS 환경 — 협업자 계정을 쓰기로 확정됐는지, IAM 권한은 어떻게 받을지
2. Node.js/npm, AWS CLI 로컬 설치 진행 여부
3. git init + GitHub 리포 생성 (이름/공개범위)
4. 코드 스캐폴딩 시작 (backend → infra → frontend 순 추천, API 계약이 먼저 정해져야 프론트가 붙기 편함)

## 원칙
- 이 프로젝트는 **강제 관리 도구가 아니라 공유 촉진 도구**다. 기능을 추가할 때 "성과 압박"보다 "공유 편의"를 우선한다.
- 사용자는 10명 이하 소규모 지인 그룹. 엔터프라이즈급 인증/권한 체계는 과설계다 — PIN 기반 최소 확인 이상으로 확장하지 않는다.
- 데이터 모델(학습 수단/내용/분량 태그)은 아직 기획 초기 단계로, [docs/data-model.md](docs/data-model.md)의 필드는 실사용 후 조정될 수 있다. 스키마 변경 시 마이그레이션 스크립트 없이도 대응 가능하도록 느슨한 구조를 유지한다.
- `amount.unit`은 사람/기록마다 다를 수 있으므로 **그룹 전체 합산 집계는 하지 않는다.** 집계는 "기록 존재 여부/빈도" 중심으로, `amount`는 개인별 추이 표시에만 사용한다.

## 하위 디렉토리
- [frontend/CLAUDE.md](frontend/CLAUDE.md)
- [backend/CLAUDE.md](backend/CLAUDE.md)
- [infra/CLAUDE.md](infra/CLAUDE.md)

## Git / 배포
- `main` = 검증된 최종 상태만 유지, 개발은 `dev` 브랜치에서 진행.
- 커밋/푸시/파일 삭제·이동은 사용자 승인 후에만 수행한다.
- `main` push 시 GitHub Actions가 Serverless Framework로 자동 배포.
