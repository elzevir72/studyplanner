# 아키텍처

## 개요
```
[User Browser]
      │
      ▼
[CloudFront] ── 정적 자산 ──> [S3 (React build)]
      │
      ▼ (API 호출, /api/*)
[API Gateway] ──> [Lambda (Python)] ──> [DynamoDB]
```

- 상시 구동 서버 없음 (완전 serverless). 트래픽이 없을 때 비용 $0에 수렴.
- 10명 규모, 하루 단위 기록이라 Lambda 콜드스타트/동시성 이슈는 실질적으로 없음.

## 결정 배경 (ADR 요약)

### 1. 프론트엔드: React(TS) + 별도 Python 백엔드
"프론트는 React, 개발 언어는 Python"이라는 초기 요구사항은 그대로는 성립하지 않음(React는 JS/TS 기반).
- Streamlit/Reflex 등 "Python만으로 React 프론트 생성" 옵션은 상시 프로세스(WebSocket 연결)가 필요해 순수 serverless(Lambda) 아키텍처와 궁합이 나쁨.
- → **React(TS) SPA + Python Lambda API**로 확정. 프론트/백엔드 언어는 다르지만, 백엔드 로직(집계, 판정 기준 등)은 전부 Python으로 작성되어 "개발 언어는 Python" 취지를 충족.

### 2. 인증: 사용자 선택 + PIN
정식 로그인 없이 드롭다운으로 사용자를 선택. 완전 무인증은 실수로 타인 기록을 건드릴 위험이 있어, 최소 확인 절차로 4자리 PIN을 둔다. 계정 관리 부담(비밀번호 재설정, 이메일 인증 등)은 만들지 않는다.
- PIN은 DynamoDB에 해시(bcrypt 등)로 저장. 세션은 짧은 TTL의 서명 토큰(JWT) 정도로 충분 — Cognito 등 별도 인증 서비스는 이 규모에 과설계.

### 3. 인프라: Serverless Framework
CDK(Python) 대신 Serverless Framework 선택. Lambda + API Gateway 중심 구성에 특화되어 있고 설정이 간결함.

### 4. 도메인: CloudFront 기본 URL (MVP)
커스텀 도메인은 비용(연 ~$12 + Route53 hosted zone ~$0.5/월)이 발생하므로 MVP에서는 보류. 나중에 도메인을 구매해도 기존 CloudFront distribution에 추가만 하면 되므로 재설계 비용 없음.

## 집계 로직 관련 결정
- **주간/격주/월간**: 캘린더 기준. 주간은 ISO 8601(월요일 시작), 월간은 달력월(1일~말일), 격주는 그룹 시작일을 anchor로 한 2주 단위.
- **미수행자 판정 (MVP)**: 해당 주(월~일)에 기록이 0건인 사용자. 목표 달성 여부 기반 판정은 "목표" 개념이 사람마다 다를 수 있어 MVP에서는 배제 — 데이터가 쌓인 뒤 재검토.
- **타임존**: KST(Asia/Seoul) 고정. 날짜 경계(자정) 판단은 서버(Lambda)에서 KST 기준으로 계산.

## 비용 추정
10명, 일 1건 기록 기준 트래픽/데이터량 매우 작음. Lambda 프리티어(월 100만 요청), DynamoDB 프리티어(25GB, 25 WCU/RCU), S3+CloudFront 소규모 트래픽 모두 무료 티어 내 — 실질 운영비 $0~$1/월 예상 (Route53 hosted zone 추가 시 +$0.5/월).
