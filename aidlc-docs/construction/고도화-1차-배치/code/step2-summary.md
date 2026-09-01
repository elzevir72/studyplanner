# Step 2 Summary — 프론트 공용 컴포넌트 7종 생성

## 생성 파일 (모두 신규)
- [frontend/src/components/Button.tsx](../../../../frontend/src/components/Button.tsx) — primary/secondary variant, 기존 `.secondary` 클래스 재사용
- [frontend/src/components/Card.tsx](../../../../frontend/src/components/Card.tsx) — `variant="default"|"highlight"`, `card`/`card-highlight` 클래스(Step 3 CSS에서 정의 예정)
- [frontend/src/components/FormField.tsx](../../../../frontend/src/components/FormField.tsx) — label+children 래퍼
- [frontend/src/components/TagSelect.tsx](../../../../frontend/src/components/TagSelect.tsx) — `multiple` prop, 단일 선택 재클릭 시 해제(Q-1=A) 구현
- [frontend/src/components/Message.tsx](../../../../frontend/src/components/Message.tsx) — error/hint/success
- [frontend/src/components/Accordion.tsx](../../../../frontend/src/components/Accordion.tsx) — `open` 유무로 제어/비제어 겸용(Q-B=A)
- [frontend/src/components/LoadingPlaceholder.tsx](../../../../frontend/src/components/LoadingPlaceholder.tsx) — 텍스트 안내 수준(Q-G=A)

## 근거
- [functional-design/frontend-components.md](../functional-design/frontend-components.md)
- [application-design/component-methods.md](../../../inception/application-design/component-methods.md)

## 비고
- 이 시점에서는 아직 어떤 페이지도 새 컴포넌트를 사용하지 않음(Step 3에서 전환) — 신규 클래스명(`card-highlight`, `form-field`, `loading-placeholder` 등)은 Step 3의 `styles.css` 재작성에서 정의됨. 그 전까지는 컴포넌트가 참조하는 일부 클래스가 아직 스타일 없이 존재.
- `automation-friendly` 규칙에 따라 `Button`에 `data-testid` prop을 열어뒀으나, 프론트에 테스트 러너가 없어 이번 배치에서는 각 사용처에 실제 `data-testid` 값을 채우지 않음(선택적 prop으로 남김, 필요 시 향후 추가 가능).
