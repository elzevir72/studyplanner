export interface UserSummary {
  user_id: string
  display_name: string
}

export interface Goal {
  value: number
  unit: string
}

export interface Entry {
  user_id: string
  date: string
  study_method: string[]
  study_topic: string[]
  amount: Goal
  goal_snapshot: Goal | null
  season_id: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Season {
  season_id: string
  name: string
  start_date: string
  end_date: string
  exam_date: string | null
  target_level: string | null
  is_current: boolean
  d_day: number | null
}

export interface ParticipantSummary {
  user_id: string
  display_name: string
  entry_count: number
  achievement_rate: number | null
}

export interface DashboardResponse {
  range: { from: string; to: string }
  participants: ParticipantSummary[]
  not_participated: string[]
  [periodLabel: string]: unknown
}

export interface FeedItem {
  user_id: string
  display_name: string
  date: string
  notes: string
}
