interface ButtonProps {
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  'data-testid'?: string
}

export default function Button({
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
  children,
  'data-testid': testId,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={variant === 'secondary' ? 'secondary' : undefined}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </button>
  )
}
