import { useEffect, useState } from 'react'
import {
  ApiError,
  adminActivateSeason,
  adminCreateMeeting,
  adminCreateSeason,
  adminCreateUser,
  adminUpdateUserStatus,
  adminVerify,
  listMeetings,
  listSeasons,
} from '../api/client'
import { clearAdminSession, getAdminSession, setAdminSession } from '../auth'
import type { Meeting, Season } from '../types'

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
    <div>
      <h1>관리자</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-password">비밀번호</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </button>
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
    <div className="card">
      <h2>참가자 계정 생성</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-user-id">user_id</label>
        <input id="new-user-id" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <label htmlFor="new-display-name">표시 이름</label>
        <input id="new-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <label htmlFor="new-pin">초기 PIN (4자리)</label>
        <input
          id="new-pin"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
        />
        {message && <p className="hint">{message}</p>}
        <button type="submit">계정 생성</button>
      </form>
    </div>
  )
}

function UpdateUserStatusForm({ token }: { token: string }) {
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('inactive')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      await adminUpdateUserStatus(userId, status, token)
      setMessage(`'${userId}' 상태가 ${status}로 변경되었습니다.`)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '상태 변경에 실패했습니다.')
    }
  }

  return (
    <div className="card">
      <h2>참가자 상태 변경</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="status-user-id">user_id</label>
        <input id="status-user-id" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <label htmlFor="status-select">상태</label>
        <select id="status-select" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        {message && <p className="hint">{message}</p>}
        <button type="submit">상태 변경</button>
      </form>
    </div>
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
    <div className="card">
      <h2>시즌 생성</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="season-id">season_id</label>
        <input id="season-id" value={seasonId} onChange={(e) => setSeasonId(e.target.value)} required />
        <label htmlFor="season-name">이름</label>
        <input id="season-name" value={name} onChange={(e) => setName(e.target.value)} required />
        <label htmlFor="start-date">시작일</label>
        <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <label htmlFor="end-date">종료일</label>
        <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <label htmlFor="exam-date">시험일 (선택)</label>
        <input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        <label htmlFor="target-level">목표 급수 (선택)</label>
        <input id="target-level" value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} />
        {message && <p className="hint">{message}</p>}
        <button type="submit">시즌 생성</button>
      </form>
    </div>
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
    <div className="card">
      <h2>시즌 전환</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="activate-season">시즌 선택</label>
        <select id="activate-season" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
          {seasons.map((s) => (
            <option key={s.season_id} value={s.season_id}>
              {s.name} {s.is_current ? '(현재)' : ''}
            </option>
          ))}
        </select>
        {message && <p className="hint">{message}</p>}
        <button type="submit" disabled={!seasonId}>
          이 시즌을 현재 시즌으로 전환
        </button>
      </form>
    </div>
  )
}

function CreateMeetingForm({ token, meetings, onCreated }: { token: string; meetings: Meeting[]; onCreated: () => void }) {
  const [date, setDate] = useState('')
  const [memo, setMemo] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      await adminCreateMeeting(date, memo, token)
      setMessage('모임이 등록되었습니다.')
      setDate('')
      setMemo('')
      onCreated()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : '모임 등록에 실패했습니다.')
    }
  }

  const sorted = [...meetings].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="card">
      <h2>오프라인 모임 등록</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="meeting-date">모임 날짜</label>
        <input id="meeting-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <label htmlFor="meeting-memo">한 줄 메모 (선택)</label>
        <input
          id="meeting-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: N2 문법 총정리"
        />
        {message && <p className="hint">{message}</p>}
        <button type="submit">모임 등록</button>
      </form>
      {sorted.length > 0 && (
        <>
          <div className="section-title-sm">등록된 모임</div>
          {sorted.map((m) => (
            <div className="feed-item" key={m.meeting_id}>
              <div className="meta">{m.date}</div>
              {m.memo && <div>{m.memo}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState(getAdminSession())
  const [seasons, setSeasons] = useState<Season[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])

  const loadSeasons = () => listSeasons().then(setSeasons).catch(() => setSeasons([]))
  const loadMeetings = () => listMeetings().then(setMeetings).catch(() => setMeetings([]))

  useEffect(() => {
    if (session) {
      loadSeasons()
      loadMeetings()
    }
  }, [session])

  if (!session) {
    return <LoginForm onLoggedIn={() => setSession(getAdminSession())} />
  }

  return (
    <div>
      <nav>
        <span style={{ flex: 1, alignSelf: 'center' }}>관리자</span>
        <button
          className="secondary"
          onClick={() => {
            clearAdminSession()
            setSession(null)
          }}
        >
          로그아웃
        </button>
      </nav>

      <CreateUserForm token={session.token} />
      <UpdateUserStatusForm token={session.token} />
      <CreateSeasonForm token={session.token} onCreated={loadSeasons} />
      <ActivateSeasonForm token={session.token} seasons={seasons} onActivated={loadSeasons} />
      <CreateMeetingForm token={session.token} meetings={meetings} onCreated={loadMeetings} />
    </div>
  )
}
