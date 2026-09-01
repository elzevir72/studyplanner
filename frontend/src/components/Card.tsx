interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'highlight'
  className?: string
}

export default function Card({ children, variant = 'default', className }: CardProps) {
  const base = variant === 'highlight' ? 'card card-highlight' : 'card'
  return <div className={className ? `${base} ${className}` : base}>{children}</div>
}
