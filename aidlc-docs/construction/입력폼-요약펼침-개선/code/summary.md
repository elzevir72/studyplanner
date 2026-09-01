# Code Generation Summary — 입력폼 요약/펼침 개선

Application Design/Functional Design을 사용자 요청으로 건너뛰고 requirements.md를 근거로 바로 구현했습니다.

## 변경 파일
- **Created**: [frontend/src/components/CollapsibleStudyItem.tsx](../../../../frontend/src/components/CollapsibleStudyItem.tsx) — 기존 `Accordion`을 재사용하는 래퍼. `collapsed` prop에 따라 요약줄(Accordion)/전체 필드(`study-item-block`)를 전환. 목표 설정 등 구조가 같은 곳에서도 재사용 가능하도록 일반화(FR-6 권장사항 반영).
- **Modified**: [frontend/src/pages/EntryPage.tsx](../../../../frontend/src/pages/EntryPage.tsx)
  - `isStudyItemComplete`, `formatAmount`, `studyItemSummary` 헬퍼 추가
  - `collapsedIndexes: Set<number>` 상태 추가
  - `getEntry` 성공 시 완료된 항목을 전부 접힌 채로 초기화 (FR-4)
  - `addStudyItem`이 완료된 기존 항목만 접고 새 항목은 펼친 채 추가 (FR-2)
  - `removeStudyItem`이 인덱스 시프트에 맞춰 접힘 상태도 재계산
  - `studyItems.map` 렌더링을 `CollapsibleStudyItem`으로 감쌈

## 요구사항 대응
| FR | 구현 |
|---|---|
| FR-1 완료 기준 | `isStudyItemComplete` = `method && amount.value > 0`, 저장 검증 로직과 동일 |
| FR-2 접힘 트리거 | `addStudyItem` 클릭 시 + 기록 로드 시에만 판정, 실시간 아님 |
| FR-3 재편집 | `CollapsibleStudyItem`의 `Accordion` `onToggle`이 펼치기 시 `collapsedIndexes`에서 제거 |
| FR-4 로드 초기 상태 | `getEntry().then()`에서 완료 항목 전부 `collapsedIndexes`에 추가 |
| FR-5 요약줄 형식 | `[method, topics.join(','), formatAmount(amount)].filter(Boolean).join(' · ')` |
| FR-6 적용 범위 | "오늘 기록"에만 적용, "목표 설정"은 미적용(기존 그대로) — `CollapsibleStudyItem`은 재사용 가능하게 설계했으나 이번엔 적용 안 함 |

## 테스트
- `npx tsc --noEmit` — 타입 에러 없음
- 브라우저 실제 조작 테스트 (실 API 연결, PIN 로그인):
  - 수단 선택 → 학습 내용 선택 → 학습량(30분) 입력 → "+ 학습 수단 추가" 클릭 → 첫 블록이 "인강 · 문법 · 30분"로 접히고 새 블록이 펼쳐짐 확인
  - 요약줄 클릭 → 기존 값 그대로 유지된 채 재펼침 확인
  - 두 번째(미완료) 블록을 삭제 후 저장 → 저장 성공(버튼이 "수정 저장"으로 전환, 삭제 버튼 노출)
  - 재로그인(페이지 새로고침 상당) → 오늘 기록이 "인강 · 문법 · 30분" 접힌 요약줄로 시작 확인 (FR-4)
