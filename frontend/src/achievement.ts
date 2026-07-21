import type { Goal } from './types'

// 백엔드 backend/domain/achievement.py의 규칙을 화면 표시용으로 그대로 미러링한다(단위 일치 시에만 계산).
export function calcAchievementRate(amount: Goal | null, goalSnapshot: Goal | null): number | null {
  if (!amount || !goalSnapshot) return null
  if (amount.unit !== goalSnapshot.unit) return null
  if (!goalSnapshot.value) return null
  return Math.round((amount.value / goalSnapshot.value) * 100)
}
