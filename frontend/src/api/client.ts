import type { DashboardResponse, Entry, FeedItem, MethodGoal, Season, StudyItem, UserSummary } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `요청 실패 (${res.status})`)
  }
  return body as T
}

// ---------- 인증(참가자) ----------
export const listUsers = () => request<UserSummary[]>('/api/users')

export const verifyPin = (user_id: string, pin: string) =>
  request<{ token: string; user_id: string; display_name: string }>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ user_id, pin }),
  })

export const changePin = (user_id: string, current_pin: string, new_pin: string, token: string) =>
  request<{ status: string }>(
    `/api/users/${user_id}/pin`,
    { method: 'PUT', body: JSON.stringify({ current_pin, new_pin }) },
    token,
  )

// ---------- 목표 ----------
export const getGoal = (user_id: string) => request<MethodGoal[] | null>(`/api/users/${user_id}/goal`)

export const setGoal = (user_id: string, goals: MethodGoal[], token: string) =>
  request<MethodGoal[]>(`/api/users/${user_id}/goal`, { method: 'PUT', body: JSON.stringify({ goals }) }, token)

// ---------- 개인 기록 ----------
export const listEntries = (user_id: string, from: string, to: string, token: string) =>
  request<Entry[]>(`/api/entries/${user_id}?from=${from}&to=${to}`, {}, token)

export const getEntry = (user_id: string, date: string, token: string) =>
  request<Entry>(`/api/entries/${user_id}/${date}`, {}, token)

export interface PutEntryInput {
  study_items: StudyItem[]
  notes: string
}

export const putEntry = (user_id: string, date: string, input: PutEntryInput, token: string) =>
  request<Entry>(`/api/entries/${user_id}/${date}`, { method: 'PUT', body: JSON.stringify(input) }, token)

export const deleteEntry = (user_id: string, date: string, token: string) =>
  request<void>(`/api/entries/${user_id}/${date}`, { method: 'DELETE' }, token)

// ---------- 시즌 ----------
export const listSeasons = () => request<Season[]>('/api/seasons')

export const currentSeason = async (): Promise<Season | null> => {
  try {
    return await request<Season>('/api/seasons/current')
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export const seasonDashboard = (season_id: string) =>
  request<{ season: Season; participants: DashboardResponse['participants'] }>(`/api/dashboard/season/${season_id}`)

// ---------- 대시보드 ----------
export const weeklyDashboard = (week?: string) =>
  request<DashboardResponse>(`/api/dashboard/weekly${week ? `?week=${week}` : ''}`)

export const biweeklyDashboard = (start?: string) =>
  request<DashboardResponse>(`/api/dashboard/biweekly${start ? `?start=${start}` : ''}`)

export const monthlyDashboard = (month?: string) =>
  request<DashboardResponse>(`/api/dashboard/monthly${month ? `?month=${month}` : ''}`)

export const feed = (from: string, to: string) => request<FeedItem[]>(`/api/dashboard/feed?from=${from}&to=${to}`)

// ---------- 관리자 ----------
export const adminVerify = (password: string) =>
  request<{ token: string }>('/api/admin/auth/verify', { method: 'POST', body: JSON.stringify({ password }) })

export const adminCreateUser = (user_id: string, display_name: string, pin: string, token: string) =>
  request(`/api/admin/users`, { method: 'POST', body: JSON.stringify({ user_id, display_name, pin }) }, token)

export const adminUpdateUserStatus = (user_id: string, status: 'active' | 'inactive', token: string) =>
  request(`/api/admin/users/${user_id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, token)

export interface CreateSeasonInput {
  season_id: string
  name: string
  start_date: string
  end_date: string
  exam_date?: string
  target_level?: string
}

export const adminCreateSeason = (input: CreateSeasonInput, token: string) =>
  request<Season>('/api/admin/seasons', { method: 'POST', body: JSON.stringify(input) }, token)

export const adminActivateSeason = (season_id: string, token: string) =>
  request(`/api/admin/seasons/${season_id}/activate`, { method: 'PATCH' }, token)
