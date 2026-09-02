import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  duration?: number
  onDismiss: () => void
}

// 화면 상단에 잠깐 떴다가 자동으로 사라지는 알림 — alert() 같은 확인 클릭을 요구하지 않는다.
export default function Toast({ message, duration = 2500, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), duration)
    const dismissTimer = setTimeout(onDismiss, duration + 300) // fade-out 애니메이션 시간만큼 여유
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(dismissTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div className={`toast${visible ? '' : ' toast-hide'}`} role="status">
      ✓ {message}
    </div>
  )
}
