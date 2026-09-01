import type { Amount, MethodGoal, StudyItem } from './types'

// 백엔드 backend/domain/achievement.py의 규칙을 화면 표시용으로 그대로 미러링한다.
// 수단(method)별 목표 대비 달성률을 구해 평균을 낸다. 목표는 있는데 그 수단 기록이 없으면 0%로 포함하고,
// 단위가 다른 수단은 비교 불가로 평균에서 제외한다. 계산 가능한 수단이 하나도 없으면 null.

function calcAmountRate(amount: Amount | null, goal: Amount | null): number | null {
  if (!amount || !goal) return null
  if (amount.unit !== goal.unit) return null
  if (!goal.value) return null
  return Math.round((amount.value / goal.value) * 100)
}

export function calcEntryAchievementRate(studyItems: StudyItem[], goalSnapshot: MethodGoal[] | null): number | null {
  if (!goalSnapshot || goalSnapshot.length === 0) return null

  const amountByMethod = new Map(studyItems.map((item) => [item.method, item.amount]))

  const rates: number[] = []
  for (const goal of goalSnapshot) {
    const amount = amountByMethod.get(goal.method) ?? null
    if (!amount) {
      // 목표는 있는데 그 수단으로 기록을 안 남긴 경우 — unit이 설정된 목표만 0%로 평균에 포함
      // (backend/domain/achievement.py의 `if goal.get("unit") is not None:` 가드와 동일하게 맞춤)
      if (goal.unit) rates.push(0)
      continue
    }
    const rate = calcAmountRate(amount, { value: goal.value, unit: goal.unit })
    if (rate !== null) rates.push(rate)
  }

  if (rates.length === 0) return null
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
}
