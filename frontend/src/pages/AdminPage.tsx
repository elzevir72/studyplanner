import { useEffect, useState } from 'react'
import {
  ApiError,
  adminActivateSeason,
  adminCreateSeason,
  adminCreateUser,
  adminListAllUsers,
  adminUpdateUserStatus,
  adminVerify,
  listSeasons,
} from '../api/client'
import { clearAdminSession, getAdminSession, setAdminSession } from '../auth'
import type { AdminUserSummary, Season } from '../types'
import Button from '../components/Button'
import Card from '../components/Card'
import FormField from '../components/FormField'
import Message from '../components/Message'

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await adminVerify(password)
      setAdminSession(result)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="narrow-shell">
      <div className="brand">
        <span className="brand-mark">🛠️</span>
        <h1>관리자</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <FormField label="비밀번호" htmlFor="admin-password">
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        {error && <Message kind="error">{error}</Message>}
        <Button type="submit" disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </Button>
      </form>
    </div>
  )
}

function CreateUserForm({ token }: { token: string }) {
  const [userId, setUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      await adminCreateUser(userId, displayName, pin, token)
      setMessage(`'${displayName}' 계정이 생성되었습니다. 계정/PIN을 참가자에게 직접 전달해주세요.`)
      setUserId('')
      setDisplayName('')
      setPin('')
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '생성에 실패했습니다.')
    }
  }

  return (
    <Card>
      <h2>참가자 계정 생성</h2>
      <form onSubmit={handleSubmit}>
        <FormField label="user_id" htmlFor="new-user-id">
          <input id="new-user-id" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </FormField>
        <FormField label="표시 이름" htmlFor="new-display-name">
          <input id="new-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </FormField>
        <FormField label="초기 PIN (4자리)" htmlFor="new-pin">
          <input
            id="new-pin"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </FormField>
        {message && <Message kind="hint">{message}</Message>}
        <Button type="submit">계정 생성</Button>
      </form>
    </Card>
  )
}

function UpdateUserStatusForm({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    adminListAllUsers(token).then((list) => {
      setUsers(list)
      if (list.length > 0) {
        setUserId(list[0].user_id)
        setStatus(list[0].status)
      }
    })
  }, [token])

  // 참가자 선택 시 — 그 참가자의 현재 상태로 select를 초기화 (서버 상태를 있는 그대로 반영)
  const handleUserSelect = (nextUserId: string) => {
    setUserId(nextUserId)
    const found = users.find((u) => u.user_id === nextUserId)
    if (found) setStatus(found.status)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      await adminUpdateUserStatus(userId, status, token)
      setMessage(`'${userId}' 상태가 ${status}로 변경되었습니다.`)
      setUsers((list) => list.map((u) => (u.user_id === userId ? { ...u, status } : u)))
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '상태 변경에 실패했습니다.')
    }
  }

  return (
    <Card>
      <h2>참가자 상태 변경</h2>
      <form onSubmit={handleSubmit}>
        <FormField label="참가자" htmlFor="status-user-id">
          <select id="status-user-id" value={userId} onChange={(e) => handleUserSelect(e.target.value)} required>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.display_name} ({u.status})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="상태" htmlFor="status-select">
          <select id="status-select" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </FormField>
        {message && <Message kind="hint">{message}</Message>}
        <Button type="submit" disabled={!userId}>
          상태 변경
        </Button>
      </form>
    </Card>
  )
}

function CreateSeasonForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [seasonId, setSeasonId] = useState('')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [examDate, setExamDate] = useState('')
  const [targetLevel, setTargetLevel] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      await adminCreateSeason(
        {
          season_id: seasonId,
          name,
          start_date: startDate,
          end_date: endDate,
          exam_date: examDate || undefined,
          target_level: targetLevel || undefined,
        },
        token,
      )
      setMessage('시즌이 생성되었습니다.')
      setSeasonId('')
      setName('')
      setStartDate('')
      setEndDate('')
      setExamDate('')
      setTargetLevel('')
      onCreated()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '시즌 생성에 실패했습니다.')
    }
  }

  return (
    <Card>
      <h2>시즌 생성</h2>
      <form onSubmit={handleSubmit}>
        <FormField label="season_id" htmlFor="season-id">
          <input id="season-id" value={seasonId} onChange={(e) => setSeasonId(e.target.value)} required />
        </FormField>
        <FormField label="이름" htmlFor="season-name">
          <input id="season-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="시작일" htmlFor="start-date">
          <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </FormField>
        <FormField label="종료일" htmlFor="end-date">
          <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </FormField>
        <FormField label="시험일 (선택)" htmlFor="exam-date">
          <input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </FormField>
        <FormField label="목표 급수 (선택)" htmlFor="target-level">
          <input id="target-level" value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} />
        </FormField>
        {message && <Message kind="hint">{message}</Message>}
        <Button type="submit">시즌 생성</Button>
      </form>
    </Card>
  )
}

function ActivateSeasonForm({ token, seasons, onActivated }: { token: string; seasons: Season[]; onActivated: () => void }) {
  const [seasonId, setSeasonId] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (seasons.length > 0 && !seasonId) setSeasonId(seasons[0].season_id)
  }, [seasons, seasonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      await adminActivateSeason(seasonId, token)
      setMessage(`'${seasonId}' 시즌이 현재 시즌으로 전환되었습니다.`)
      onActivated()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '시즌 전환에 실패했습니다.')
    }
  }

  return (
    <Card>
      <h2>시즌 전환</h2>
      <form onSubmit={handleSubmit}>
        <FormField label="시즌 선택" htmlFor="activate-season">
          <select id="activate-season" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
            {seasons.map((s) => (
              <option key={s.season_id} value={s.season_id}>
                {s.name} {s.is_current ? '(현재)' : ''}
              </option>
            ))}
          </select>
        </FormField>
        {message && <Message kind="hint">{message}</Message>}
        <Button type="submit" disabled={!seasonId}>
          이 시즌을 현재 시즌으로 전환
        </Button>
      </form>
    </Card>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState(getAdminSession())
  const [seasons, setSeasons] = useState<Season[]>([])

  const loadSeasons = () => listSeasons().then(setSeasons).catch(() => setSeasons([]))

  useEffect(() => {
    if (session) loadSeasons()
  }, [session])

  if (!session) {
    return <LoginForm onLoggedIn={() => setSession(getAdminSession())} />
  }

  return (
    <div>
      <nav>
        <span className="nav-title">관리자</span>
        <Button
          variant="secondary"
          onClick={() => {
            clearAdminSession()
            setSession(null)
          }}
        >
          로그아웃
        </Button>
      </nav>

      <CreateUserForm token={session.token} />
      <UpdateUserStatusForm token={session.token} />
      <CreateSeasonForm token={session.token} onCreated={loadSeasons} />
      <ActivateSeasonForm token={session.token} seasons={seasons} onActivated={loadSeasons} />
    </div>
  )
}
