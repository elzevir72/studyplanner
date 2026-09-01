# Build Instructions

## Prerequisites
- **Frontend**: Node.js/npm, Vite 5, TypeScript 5 (`frontend/package.json`)
- **Backend**: Python 3.12 (Lambda 런타임과 일치), `backend/requirements.txt`(boto3, PyJWT, bcrypt)
- **Infra**: Serverless Framework v3 (`npx --prefix infra serverless`), AWS 자격증명(배포 시에만 필요)
- **Environment Variables**: `VITE_API_URL`(프론트, 선택 — 미설정 시 `http://localhost:3000`), `JWT_SECRET`(백엔드, 배포 시 GitHub Secrets로 주입)

## Build Steps

### 1. Install Dependencies
```bash
cd frontend && npm install
```
백엔드는 별도 빌드 없이 리포 루트에 `pip install -t . --platform manylinux2014_x86_64 --only-binary=:all: -r backend/requirements.txt`로 배포 시점에 설치(CI 전용, 로컬 개발엔 불필요 — `infra/CLAUDE.md` 참고).

### 2. Configure Environment
로컬 개발은 별도 설정 없이 `frontend/.env`에 `VITE_API_URL`만 필요 시 지정.

### 3. Build All Units
```bash
cd frontend && npm run build
```
백엔드는 별도 빌드 단계 없음(Lambda가 소스를 그대로 실행) — 대신 `python -m py_compile backend/handlers/*.py`로 문법 검증 가능.

### 4. Verify Build Success
- **Expected Output**: `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css` 생성, 에러 없이 `built in Xs` 메시지로 종료
- **Build Artifacts**: `frontend/dist/`
- **Common Warnings**: 없음(이번 빌드에서 경고 없이 클린 통과 확인)

## 실제 실행 결과 (이번 배치, 2026-08-31)
```
> study-planner-frontend@0.1.0 build
> tsc && vite build

✓ 49 modules transformed.
dist/index.html                   0.61 kB │ gzip:  0.40 kB
dist/assets/index-BFa5WvW7.css    6.08 kB │ gzip:  1.78 kB
dist/assets/index-D-bFLKHZ.js   187.74 kB │ gzip: 60.46 kB
✓ built in 1.14s
```
`tsc`(타입 체크) + `vite build` 모두 에러 없이 통과.

## Troubleshooting

### Build Fails with Dependency Errors
- **Cause**: `node_modules` 손상 또는 lockfile 불일치
- **Solution**: `rm -rf node_modules package-lock.json && npm install`

### Build Fails with Compilation Errors
- **Cause**: TypeScript 타입 불일치(신규 컴포넌트 props와 사용처 불일치 등)
- **Solution**: `npx tsc --noEmit`로 에러 위치 확인 후 해당 파일 수정
