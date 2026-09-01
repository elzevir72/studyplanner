import Accordion from './Accordion'

interface CollapsibleStudyItemProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
  summary: string
  children: React.ReactNode
}

// 학습 수단 블록(및 목표 설정처럼 구조가 같은 블록)을 요약/펼침으로 전환하는 래퍼.
// collapsed=true면 Accordion(제어형)으로 요약 한 줄만 보여주고, false면 children(전체 필드)을 그대로 렌더링한다.
// "완료" 판정과 접힘 트리거 시점은 호출자(페이지)가 결정한다 — 이 컴포넌트는 순수하게 collapsed 여부만 반영한다.
export default function CollapsibleStudyItem({ collapsed, onToggle, summary, children }: CollapsibleStudyItemProps) {
  if (collapsed) {
    return (
      <Accordion
        summary={summary}
        open={false}
        onToggle={(isOpen) => {
          if (isOpen) onToggle(false)
        }}
      >
        {children}
      </Accordion>
    )
  }
  return <div className="study-item-block">{children}</div>
}
