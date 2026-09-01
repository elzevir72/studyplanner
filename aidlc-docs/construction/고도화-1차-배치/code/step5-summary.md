# Step 5 Summary — 문서 정합성 정정 + Config 테이블 제거 (FR-4, FR-5)

## 변경 파일
- **Modified**: [docs/api.md](../../../../docs/api.md)
  - `GET /entries/{user_id}` / `GET /entries/{user_id}/{date}` 인가 설명을 "본인만" → 실제 동작(로그인한 참가자면 누구나, `require_participant`만 검사)으로 정정
  - `PUT /entries/{user_id}/{date}`, `GET /dashboard/meetings`가 활성 시즌 없을 때 `400` 반환하는 동작 추가 문서화
  - `GET /users/{user_id}/goal`이 목표 미설정 시 `null`을 그대로 반환하는 동작 문서화
  - 신규 `GET /admin/users` 엔드포인트 문서화(Step 4에서 추가한 엔드포인트)
- **Modified**: [infra/CLAUDE.md](../../../../infra/CLAUDE.md) — Lambda 함수 개수를 실제 개수(26개, Step 4의 신규 엔드포인트 반영)로 정정
- **Modified**: [docs/data-model.md](../../../../docs/data-model.md) — `Config` 테이블 문서 섹션 제거
- **Modified**: [docs/architecture.md](../../../../docs/architecture.md) — ADR 8에 `Config` 테이블이 이번에 완전히 제거되었다는 각주 추가
- **Modified**: [serverless.yml](../../../../serverless.yml) — `ConfigTable` 정의, `CONFIG_TABLE` 환경변수, IAM `Resource`의 `!GetAtt ConfigTable.Arn` 3곳 제거 (application-design/services.md에서 확정한 정확한 범위)

## 근거
- [inception/requirements/requirements.md](../../../inception/requirements/requirements.md) FR-4, FR-5
- [inception/application-design/services.md](../../../inception/application-design/services.md) — FR-5 변경 범위(3곳) 확정 근거

## 미해결로 남긴 항목 (조사 후 판단)
- **커밋 `70d32cb` 서술 오류 정정**: requirements.md는 "루트 CLAUDE.md의 커밋 서술이 실제 diff와 반대"라고 정정 대상으로 지목했으나, 실제로 루트 `CLAUDE.md` 파일을 검색한 결과 이 커밋에 대한 서술 자체가 현재 파일에 존재하지 않음을 확인(`grep`으로 재검증). Reverse Engineering이 지목한 "CLAUDE.md 커밋 로그"는 실제로는 **git 커밋 메시지 자체**(`git log`)를 가리킨 것으로 판단됨 — 커밋 메시지는 이미 확정된 과거 이력이라 재작성 대상이 아니고(이 프로젝트의 git 원칙에 커밋 재작성 관례 없음), 고칠 문서가 실제로 없어 이 항목은 스킵.

## 테스트
- YAML 파서로 `serverless.yml` 재검증 — 통과, `Config` 관련 참조 완전 제거 확인
- `backend/` 전체에서 `CONFIG_TABLE`/`ConfigTable` 참조 없음을 grep으로 재확인(원래도 죽은 코드였으므로 제거로 인한 회귀 없음)
