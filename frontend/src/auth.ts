// 참가자 인증 상태와 관리자 인증 상태는 완전히 분리된 localStorage 키를 쓴다 —
// 같은 브라우저에서 참가자 로그인 중이어도 관리자 로그인 여부와 서로 영향을 주지 않는다.

const PARTICIPANT_KEY = 'sp_participant_session'
const ADMIN_KEY = 'sp_admin_session'

export interface ParticipantSession {
  token: string
  user_id: string
  display_name: string
}

export interface AdminSession {
  token: string
}

export function getParticipantSession(): ParticipantSession | null {
  const raw = localStorage.getItem(PARTICIPANT_KEY)
  return raw ? (JSON.parse(raw) as ParticipantSession) : null
}

export function setParticipantSession(session: ParticipantSession): void {
  localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(session))
}

export function clearParticipantSession(): void {
  localStorage.removeItem(PARTICIPANT_KEY)
}

export function getAdminSession(): AdminSession | null {
  const raw = localStorage.getItem(ADMIN_KEY)
  return raw ? (JSON.parse(raw) as AdminSession) : null
}

export function setAdminSession(session: AdminSession): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(session))
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_KEY)
}
