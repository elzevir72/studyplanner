# Study Planner

최대 10명 규모 스터디 그룹을 위한 학습 이력 기록 및 공유 대시보드.

## 목적
- 참가자는 **각자 알아서** day-by-day 학습 이력을 기록한다.
- 그룹은 **누가 얼마나 공유했는지**를 대시보드로 파악하고, 이를 바탕으로 의견을 나눈다.
- 강제성 있는 성과 관리 도구가 아니라, **최소한의 동기부여 + 공유 촉진**이 목적이다.

## 기술 스택
| 영역 | 선택 |
|---|---|
| 프론트엔드 | React (TypeScript), S3 + CloudFront 정적 호스팅 |
| 백엔드 | Python (AWS Lambda) + API Gateway |
| DB | DynamoDB |
| 인증 | 사용자 선택(드롭다운) + 4자리 PIN (정식 로그인 아님) |
| IaC / 배포 | Serverless Framework, GitHub Actions (push to main → 자동 배포) |
| 도메인 | CloudFront 기본 URL (MVP), 추후 커스텀 도메인 연결 가능 |

## 문서
- [docs/architecture.md](docs/architecture.md) — 전체 아키텍처 및 결정 배경
- [docs/data-model.md](docs/data-model.md) — DynamoDB 스키마
- [docs/api.md](docs/api.md) — API 엔드포인트 목록

## 저장소 구조
```
study_planner/
├── frontend/   # React SPA
├── backend/    # Lambda 핸들러 (Python)
├── infra/      # Serverless Framework 설정
└── docs/       # 설계 문서
```

## 상태
설계 단계. 데이터 모델(학습 수단/내용/분량 태그 체계)과 미수행자 판정 기준은 실제 사용 데이터를 보며 반복적으로 조정할 예정.
