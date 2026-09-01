interface MessageProps {
  kind: 'error' | 'hint' | 'success'
  children: React.ReactNode
}

const CLASS_BY_KIND: Record<MessageProps['kind'], string> = {
  error: 'error',
  hint: 'hint',
  success: 'hint success',
}

export default function Message({ kind, children }: MessageProps) {
  return <p className={CLASS_BY_KIND[kind]}>{children}</p>
}
