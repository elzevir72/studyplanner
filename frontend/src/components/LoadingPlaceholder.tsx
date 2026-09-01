interface LoadingPlaceholderProps {
  label?: string
}

export default function LoadingPlaceholder({ label = '불러오는 중...' }: LoadingPlaceholderProps) {
  return <p className="loading-placeholder">{label}</p>
}
