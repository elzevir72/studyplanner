import { useState } from 'react'

interface AccordionProps {
  summary: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onToggle?: (open: boolean) => void
  defaultOpen?: boolean
}

// open을 전달하지 않으면 비제어(내부 상태로 자체 관리) — EntryPage의 단순 접이식.
// open을 전달하면 제어형(부모가 상태 소유) — DashboardPage의 모임 회차(상호배타는 부모 책임).
export default function Accordion({ summary, children, open, onToggle, defaultOpen = false }: AccordionProps) {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = isControlled ? open : internalOpen

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const next = e.currentTarget.open
    if (!isControlled) setInternalOpen(next)
    onToggle?.(next)
  }

  return (
    <details className="accordion" open={isOpen} onToggle={handleToggle}>
      <summary>{summary}</summary>
      <div className="acc-body">{children}</div>
    </details>
  )
}
