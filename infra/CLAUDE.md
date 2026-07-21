# Infra — 가이드

Serverless Framework 기반 IaC. 아키텍처 배경은 [../docs/architecture.md](../docs/architecture.md) 참고.

## 원칙
- 리소스: API Gateway + Lambda(Python) + DynamoDB(`Users`, `Entries`, `Config`, `Seasons`, `Admin`) + S3(정적 호스팅) + CloudFront.
- 커스텀 도메인/Route53은 MVP에서 구성하지 않는다 (CloudFront 기본 URL 사용). 나중에 추가해도 기존 리소스 재설계 불필요.
- 배포는 GitHub Actions에서 `main` 브랜치 push 시 자동 실행. AWS 자격증명은 GitHub Secrets로 관리, 리포지토리에 절대 커밋하지 않는다.
- 리소스 이름에 스테이지(`dev`/`prod`) 접두사를 붙여 향후 스테이지 분리가 필요해지면 대응 가능하게 한다 (현재는 단일 스테이지로 충분).
- 여러 스터디 그룹을 지원해야 할 경우, 스키마에 손대지 않고 같은 스테이지 분리 메커니즘으로 그룹마다 완전히 별도 스택을 배포한다 (배경: [architecture.md](../docs/architecture.md) ADR 9).
- 관리자(`Admin`) 계정 초기 생성/비밀번호 재설정은 자동 배포 파이프라인에 넣지 않고, 배포 권한을 가진 사람이 로컬에서 수동 시딩 스크립트를 1회 실행하는 방식으로 처리한다(idempotent, 배경: [architecture.md](../docs/architecture.md) ADR 14). **AWS 계정 운영 방식이 아직 미정**이라 스크립트 구현은 보류 — 최종 플랫폼(AWS 유지 vs Vercel+별도 DB 등) 확정 후 작성.

## 아직 없는 것
코드 스캐폴딩 전 단계. 구현 시작 시 `serverless.yml`, `.github/workflows/deploy.yml` 작성 예정.
