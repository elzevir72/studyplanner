export interface UserSummary {
  user_id: string
  display_name: string
}

export interface Amount {
  value: number
  unit: string
}

export interface MethodGoal {
  method: string
  value: number
  unit: string
}

export interface StudyItem {
  method: string
  topics: string[]
  amount: Amount
}

export interface Entry {
  user_id: string
  date: string
  study_items: StudyItem[]
  goal_snapshot: MethodGoal[] | null
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

export interface Meeting {
  meeting_id: string
  date: string
  memo: string
  created_by: string
  created_at: string
}

export interface MeetingRoundSummary {
  round: number
  meeting_id: string
  created_by: string
  range: { from: string; to: string }
  memo: string
  participants: ParticipantSummary[]
  not_participated: string[]
}
