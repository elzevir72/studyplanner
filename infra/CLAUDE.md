# Infra — 가이드

Serverless Framework 기반 IaC. 아키텍처 배경은 [../docs/architecture.md](../docs/architecture.md) 참고.

## 원칙
- 리소스: API Gateway + Lambda(Python) + DynamoDB(`Users`, `Entries`, `Config`, `Seasons`) + S3(정적 호스팅) + CloudFront.
- 커스텀 도메인/Route53은 MVP에서 구성하지 않는다 (CloudFront 기본 URL 사용). 나중에 추가해도 기존 리소스 재설계 불필요.
- 배포는 GitHub Actions에서 `main` 브랜치 push 시 자동 실행. AWS 자격증명은 GitHub Secrets로 관리, 리포지토리에 절대 커밋하지 않는다.
- 리소스 이름에 스테이지(`dev`/`prod`) 접두사를 붙여 향후 스테이지 분리가 필요해지면 대응 가능하게 한다 (현재는 단일 스테이지로 충분).
- 여러 스터디 그룹을 지원해야 할 경우, 스키마에 손대지 않고 같은 스테이지 분리 메커니즘으로 그룹마다 완전히 별도 스택을 배포한다 (배경: [architecture.md](../docs/architecture.md) ADR 9).

## 아직 없는 것
코드 스캐폴딩 전 단계. 구현 시작 시 `serverless.yml`, `.github/workflows/deploy.yml` 작성 예정.
