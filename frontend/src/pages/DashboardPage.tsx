import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ApiError,
  createMeeting,
  currentSeason,
  deleteMeeting,
  feed,
  listMeetings,
  meetingRoundsDashboard,
  monthlyDashboard,
  seasonDashboard,
  updateMeeting,
  weeklyDashboard,
} from '../api/client'
import { clearParticipantSession, getParticipantSession } from '../auth'
import DdayBanner from '../components/DdayBanner'
import Button from '../components/Button'
import FormField from '../components/FormField'
import Message from '../components/Message'
import Accordion from '../components/Accordion'
import LoadingPlaceholder from '../components/LoadingPlaceholder'
import Toast from '../components/Toast'
import type { DashboardResponse, FeedItem, Meeting, MeetingRoundSummary, ParticipantSummary, Season } from '../types'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

type ViewKind = 'weekly' | 'meetings' | 'monthly' | 'season'

function ParticipantList({ participants, notParticipated }: { participants: ParticipantSummary[]; notParticipated: string[] }) {
  const notParticipatedSet = new Set(notParticipated)
  return (
    <>
      {participants.map((p) => {
        const missing = notParticipatedSet.has(p.user_id)
        return (
          <div className={`person-row${missing ? ' missing' : ''}`} key={p.user_id}>
            <span className="name">{p.display_name}</span>
            <div className="bar-track">
              {!missing && p.achievement_rate !== null && (
                <div
                  className={`bar-fill${p.achievement_rate < 50 ? ' low' : ''}`}
                  style={{ width: `${Math.min(100, p.achievement_rate)}%` }}
                />
              )}
            </div>
            <span className="pct">
              {missing ? '기록 전' : p.achievement_rate !== null ? `${p.achievement_rate}%` : `기록 ${p.entry_count}`}
            </span>
          </div>
        )
      })}
    </>
  )
}

function SummaryStrip({ participants }: { participants: ParticipantSummary[] }) {
  return (
    <div className="summary-strip">
      <div className="summary-chip">
        <div className="num">{participants.length}명</div>
        <div className="lbl">참여 인원</div>
      </div>
      <div className="summary-chip">
        <div className="num">{participants.filter((p) => p.entry_count > 0).length}명</div>
        <div className="lbl">기록 있음</div>
      </div>
      <div className="summary-chip">
        <div className="num">
          {(() => {
            const rates = participants.map((p) => p.achievement_rate).filter((r): r is number => r !== null)
            if (rates.length === 0) return '-'
            return `${Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)}%`
          })()}
        </div>
        <div className="lbl">평균 달성률</div>
      </div>
    </div>
  )
}

function EditMeetingForm({
  round,
  token,
  isOwner,
  onSaved,
  onCancel,
}: {
  round: MeetingRoundSummary
  token: string
  isOwner: boolean
  onSaved: (toastMessage: string) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(round.range.to)
  const [memo, setMemo] = useState(round.memo)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      await updateMeeting(round.meeting_id, date, memo, token)
      onSaved('수정이 완료되었습니다.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 모임을 삭제할까요?')) return
    setSaving(true)
    try {
      await deleteMeeting(round.meeting_id, token)
      onSaved('삭제가 완료되었습니다.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
      setSaving(false)
    }
  }

  return (
    <div className="study-item-block">
      <FormField label="모임 날짜">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormField>
      <FormField label="한 줄 메모">
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: N2 문법 총정리" />
      </FormField>
      {error && <Message kind="error">{error}</Message>}
      <Button onClick={handleSave} disabled={saving}>
        저장
      </Button>
      <Button variant="secondary" onClick={onCancel} disabled={saving}>
        취소
      </Button>
      {isOwner ? (
        <Button variant="secondary" onClick={handleDelete} disabled={saving}>
          이 모임 삭제
        </Button>
      ) : (
        <Message kind="hint">삭제는 이 모임을 등록한 참가자만 할 수 있어요.</Message>
      )}
    </div>
  )
}

function AddMeetingForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [date, setDate] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await createMeeting(date, memo, token)
      setDate('')
      setMemo('')
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="study-item-block">
      <FormField label="모임 날짜" htmlFor="new-meeting-date">
        <input id="new-meeting-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </FormField>
      <FormField label="한 줄 메모 (선택)" htmlFor="new-meeting-memo">
        <input
          id="new-meeting-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: N2 문법 총정리"
        />
      </FormField>
      {error && <Message kind="error">{error}</Message>}
      <Button type="submit" disabled={saving}>
        모임 등록
      </Button>
    </form>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getParticipantSession()!

  const [toastMessage, setToastMessage] = useState<string | null>(
    (location.state as { toast?: string } | null)?.toast ?? null,
  )

  const dismissToast = () => {
    setToastMessage(null)
    // 새로고침/뒤로가기 시 같은 토스트가 다시 뜨지 않도록 history state를 정리
    // (StrictMode의 effect 이중 실행과 무관하게, 토스트가 실제로 사라질 때 한 번만 호출됨)
    if ((location.state as { toast?: string } | null)?.toast) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }

  const [season, setSeason] = useState<Season | null>(null)
  const [view, setView] = useState<ViewKind>('meetings') // 오프라인 모임이 실제 스터디 주기와 일치하는 기본 뷰
  const [participants, setParticipants] = useState<ParticipantSummary[]>([])
  const [notParticipated, setNotParticipated] = useState<string[]>([])
  const [range, setRange] = useState<{ from: string; to: string } | null>(null)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(false)

  const [rounds, setRounds] = useState<MeetingRoundSummary[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [openRound, setOpenRound] = useState<number | null>(null)
  const [editingRound, setEditingRound] = useState<number | null>(null)

  useEffect(() => {
    currentSeason().then(setSeason).catch(() => setSeason(null))
  }, [])

  const loadMeetingRounds = async () => {
    const [rounds, allMeetings] = await Promise.all([meetingRoundsDashboard(), listMeetings()])
    setRounds(rounds)
    setOpenRound(rounds.length > 0 ? rounds[rounds.length - 1].round : null)
    const today = todayStr()
    setUpcomingMeetings(allMeetings.filter((m) => m.date > today).sort((a, b) => a.date.localeCompare(b.date)))
  }

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      if (view === 'meetings') {
        await loadMeetingRounds()
        return
      }

      if (view === 'season') {
        if (!season) {
          setParticipants([])
          setRange(null)
          return
        }
        const res = await seasonDashboard(season.season_id)
        setParticipants(res.participants)
        setNotParticipated([])
        setRange({ from: season.start_date, to: season.end_date })
        return
      }

      let res: DashboardResponse
      if (view === 'weekly') res = await weeklyDashboard()
      else res = await monthlyDashboard()

      setParticipants(res.participants)
      setNotParticipated(res.not_participated)
      setRange(res.range)
    }
    load().finally(() => setLoading(false))
  }, [view, season])

  useEffect(() => {
    if (view === 'meetings') return
    if (!range) return
    feed(range.from, range.to)
      .then(setFeedItems)
      .catch(() => setFeedItems([]))
  }, [range, view])

  const handleLogout = () => {
    clearParticipantSession()
    navigate('/')
  }

  return (
    <div>
      {toastMessage && <Toast message={toastMessage} onDismiss={dismissToast} />}
      <nav>
        <span className="nav-title">그룹 대시보드</span>
        <a href="/entry">내 기록</a>
        <Button variant="secondary" onClick={handleLogout}>
          로그아웃
        </Button>
      </nav>

      <DdayBanner season={season} />

      {season && (
        <Message kind="hint">
          현재 시즌: {season.name} ({season.start_date} ~ {season.end_date})
        </Message>
      )}

      <div className="view-tabs">
        <button className={view === 'weekly' ? 'active' : 'secondary'} onClick={() => setView('weekly')}>
          주간
        </button>
        <button className={view === 'meetings' ? 'active' : 'secondary'} onClick={() => setView('meetings')}>
          오프라인 모임
        </button>
        <button className={view === 'monthly' ? 'active' : 'secondary'} onClick={() => setView('monthly')}>
          월간
        </button>
        <button className={view === 'season' ? 'active' : 'secondary'} onClick={() => setView('season')}>
          이번 시즌
        </button>
      </div>

      {loading ? (
        <LoadingPlaceholder />
      ) : view === 'meetings' ? (
        <>
          {rounds.length === 0 && <Message kind="hint">아직 등록된 오프라인 모임이 없어요.</Message>}
          {rounds.map((r) => (
            <Accordion
              key={r.round}
              open={openRound === r.round}
              onToggle={(isOpen) => setOpenRound(isOpen ? r.round : null)}
              summary={
                <>
                  {r.round}회차 · {r.range.to}
                  {r.memo ? ` · ${r.memo}` : ''}
                </>
              }
            >
              {editingRound === r.round ? (
                <EditMeetingForm
                  round={r}
                  token={session.token}
                  isOwner={r.created_by === session.user_id}
                  onSaved={(message) => {
                    setEditingRound(null)
                    setToastMessage(message)
                    loadMeetingRounds()
                  }}
                  onCancel={() => setEditingRound(null)}
                />
              ) : (
                <>
                  <Message kind="hint">
                    {r.range.from} ~ {r.range.to}
                  </Message>
                  <Button variant="secondary" onClick={() => setEditingRound(r.round)}>
                    이 모임 수정 / 삭제
                  </Button>
                  <SummaryStrip participants={r.participants} />
                  <div className="section-title-sm">참가자별 달성률</div>
                  <ParticipantList participants={r.participants} notParticipated={r.not_participated} />
                </>
              )}
            </Accordion>
          ))}

          {upcomingMeetings.length > 0 && (
            <>
              <div className="section-title-sm">예정된 모임</div>
              {upcomingMeetings.map((m) => (
                <div className="feed-item" key={m.meeting_id}>
                  <div className="meta">{m.date}</div>
                  {m.memo && <div>{m.memo}</div>}
                </div>
              ))}
            </>
          )}

          <div className="section-title-sm">새 모임 등록</div>
          <AddMeetingForm token={session.token} onCreated={loadMeetingRounds} />
        </>
      ) : (
        <>
          {range && (
            <Message kind="hint">
              {range.from} ~ {range.to}
            </Message>
          )}
          <SummaryStrip participants={participants} />
          <div className="section-title-sm">참가자별 달성률</div>
          <ParticipantList participants={participants} notParticipated={notParticipated} />
        </>
      )}

      {view !== 'meetings' && (
        <>
          <div className="section-title-sm">공유 메모</div>
          {feedItems.length === 0 && <Message kind="hint">공유된 메모가 없습니다.</Message>}
          {feedItems.map((item) => (
            <div className="feed-item" key={`${item.user_id}-${item.date}`}>
              <div className="meta">
                {item.display_name} · {item.date}
              </div>
              <div>{item.notes}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
