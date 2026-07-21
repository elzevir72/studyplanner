import type { Season } from '../types'

// exam_date가 없으면 배너 자체를 숨긴다 — 능동 알림이 아니라 접속 시에만 보이는 정보성 표시.
export default function DdayBanner({ season }: { season: Season | null }) {
  if (!season || season.d_day === null || season.d_day === undefined) return null

  const text =
    season.d_day >= 0 ? `${season.name} 시험까지 ${season.d_day}일 남았습니다` : `${season.name} 시험일이 지났습니다`

  return <div className="dday-banner">{text}</div>
}
