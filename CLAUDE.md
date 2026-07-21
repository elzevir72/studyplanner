# Study Planner — 루트 가이드

10명 이하 스터디 그룹용 학습 이력 기록/공유 도구. 상세 배경은 [README.md](README.md), 아키텍처 결정은 [docs/architecture.md](docs/architecture.md) 참고.

## 진행 상황 (2026-07-21 기준)

**완료**
- [x] 요구사항 검토 및 스택/설계 결정 확정 (React+TS / Python Lambda / DynamoDB / Serverless Framework / PIN 인증 / CloudFront 기본 URL)
- [x] 설계 문서 작성 및 확장: `README.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/api.md` (목표/달성률, 시즌, 멤버 비활성화, 모바일 우선 등 기능 기획 반영)
- [x] 하위 디렉토리 `CLAUDE.md` 3종 작성 (backend/frontend/infra)
- [x] Sheets 프로토타입 생성 (참고용으로 보관, 라이브 실증에는 쓰지 않음): `prototype-sheets/`
- [x] GitHub 리포지토리 등록 완료: `https://github.com/elzevir72/studyplanner` (Public). `main`=검증된 상태, `dev`=개발 브랜치. **이제 GitHub이 프로젝트 source of truth.**
- [x] 기능 기획 1차 완료 — 목표 설정/달성률(%), 시즌(Season), 멤버 비활성화(status), 멀티그룹 대응 방식(별도 배포), 알림 제외, 모바일 우선. 상세 근거는 [docs/architecture.md](docs/architecture.md) ADR 5~11 참고.

**미완료 / 다음에 이어갈 것**
- [ ] 이번 세션의 문서 변경사항 커밋/푸시 대기 중 (사용자 승인 필요)
- [ ] AWS 환경 확정 대기 — 협업자의 기존 AWS 계정/IAM을 쓸지 아직 안 정해짐. Vercel + AWS RDS(MariaDB) 전환 제안도 검토만 하고 최종 결론 안 남(현재 기본값은 기존 스택 유지) — 자세한 내용은 auto-memory `project_study_planner.md` 참고
- [ ] Node.js/npm, AWS CLI, GitHub CLI(gh), winget 모두 로컬 미설치 상태
- [ ] 코드 스캐폴딩 전혀 시작 안 함 — `backend/`, `frontend/`, `infra/`는 CLAUDE.md만 있고 실제 코드 없음
- [ ] 인앱 상호작용(동료와의 협업 워크플로 포함)은 사용자가 "코딩은 협업 진행하면서 구성"한다고 밝힘 — 코드 스캐폴딩 시점은 협업자 합류 이후가 될 가능성 있음
- [ ] 그룹 대시보드에 평균 달성률(%) 노출 여부 — "무압박" 원칙과 상충 여부 검토 필요해 미정 ([docs/api.md](docs/api.md) 참고)

**다음 세션 시작 시 확인할 것 (우선순위 순):**
1. 이번 세션 문서 변경사항 커밋/푸시 여부
2. Vercel/MariaDB 전환 제안 및 AWS 환경(협업자 계정) — 결론 냈는지
3. 코드 스캐폴딩 시작 시점 — 협업자 합류 여부에 달려있을 수 있음

## 원칙
- 이 프로젝트는 **강제 관리 도구가 아니라 공유 촉진 도구**다. 기능을 추가할 때 "성과 압박"보다 "공유 편의"를 우선한다.
- 사용자는 10명 이하 소규모 지인 그룹(현재 실제 참가자 5명 내외, 일본어 JLPT 학습 스터디). 엔터프라이즈급 인증/권한 체계는 과설계다 — PIN 기반 최소 확인 이상으로 확장하지 않는다.
- 데이터 모델(학습 수단/내용/분량 태그)은 아직 기획 초기 단계로, [docs/data-model.md](docs/data-model.md)의 필드는 실사용 후 조정될 수 있다. 스키마 변경 시 마이그레이션 스크립트 없이도 대응 가능하도록 느슨한 구조를 유지한다.
- `amount.unit`은 사람/기록마다 다를 수 있으므로 **그룹 전체 합산 집계는 하지 않는다.** 집계는 "기록 존재 여부/빈도" 중심으로, `amount`는 개인별 추이 표시에만 사용한다.
- 목표(`daily_goal`)는 참가자별 자율 설정 — 그룹 공통 목표를 강제하지 않는다(가용 학습 시간 편차가 크고 참여가 불규칙적이라서). 달성률(%)은 `amount`/`goal_snapshot`(기록 시점 스냅샷) 기준으로 계산하며, 목표를 나중에 바꿔도 과거 기록에는 소급 반영하지 않는다.
- 인앱 댓글/리액션 기능은 넣지 않는다 — 격주 오프라인 모임이 그 역할을 대체한다. `notes`는 그 모임의 사전 공유 자료로 취급.
- 멤버 탈퇴는 삭제가 아니라 `status=inactive` 전환. 데이터는 보존하고 대시보드/드롭다운에서만 제외.
- 학습 데이터는 시즌(`Seasons`) 단위로 구분한다 — 같은 급수를 여러 회차 재도전하는 경우를 지원. 격주 집계 anchor도 현재 시즌의 시작일 기준.
- 다른 스터디 그룹 지원이 필요해지면 스키마 확장이 아니라 **그룹별 별도 배포**로 대응한다 (스테이지 분리 메커니즘 재사용).
- 리마인더/알림 기능은 넣지 않는다 (격주 모임으로 충분, 비용/복잡도 대비 실익 낮음).
- 모바일 우선 반응형 웹으로 설계한다 (네이티브 앱 아님).

## 하위 디렉토리
- [frontend/CLAUDE.md](frontend/CLAUDE.md)
- [backend/CLAUDE.md](backend/CLAUDE.md)
- [infra/CLAUDE.md](infra/CLAUDE.md)

## Git / 배포
- `main` = 검증된 최종 상태만 유지, 개발은 `dev` 브랜치에서 진행.
- 커밋/푸시/파일 삭제·이동은 사용자 승인 후에만 수행한다.
- `main` push 시 GitHub Actions가 Serverless Framework로 자동 배포.
