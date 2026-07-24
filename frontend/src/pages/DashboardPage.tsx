import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { biweeklyDashboard, currentSeason, feed, monthlyDashboard, seasonDashboard, weeklyDashboard } from '../api/client'
import { clearParticipantSession, getParticipantSession } from '../auth'
import DdayBanner from '../components/DdayBanner'
import type { DashboardResponse, FeedItem, ParticipantSummary, Season } from '../types'

type ViewKind = 'weekly' | 'biweekly' | 'monthly' | 'season'

export default function DashboardPage() {
  const navigate = useNavigate()
  const session = getParticipantSession()!

  const [season, setSeason] = useState<Season | null>(null)
  const [view, setView] = useState<ViewKind>('biweekly') // 격주 뷰가 실제 오프라인 모임 주기와 일치하는 기본 뷰
  const [participants, setParticipants] = useState<ParticipantSummary[]>([])
  const [notParticipated, setNotParticipated] = useState<string[]>([])
  const [range, setRange] = useState<{ from: string; to: string } | null>(null)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    currentSeason().then(setSeason).catch(() => setSeason(null))
  }, [])

  useEffect(() => {
    setLoading(true)
    const load = async () => {
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
      else res = view === 'biweekly' ? await biweeklyDashboard() : await monthlyDashboard()

      setParticipants(res.participants)
      setNotParticipated(res.not_participated)
      setRange(res.range)
    }
    load().finally(() => setLoading(false))
  }, [view, season])

  useEffect(() => {
    if (!range) return
    feed(range.from, range.to)
      .then(setFeedItems)
      .catch(() => setFeedItems([]))
  }, [range])

  const handleLogout = () => {
    clearParticipantSession()
    navigate('/')
  }

  const notParticipatedSet = new Set(notParticipated)

  return (
    <div>
      <nav>
        <span style={{ flex: 1, alignSelf: 'center' }}>그룹 대시보드</span>
        <a href="/entry">내 기록</a>
        <button className="secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </nav>

      <DdayBanner season={season} />

      {season && (
        <p className="hint">
          현재 시즌: {season.name} ({season.start_date} ~ {season.end_date})
        </p>
      )}

      <div className="view-tabs">
        <button className={view === 'weekly' ? 'active' : 'secondary'} onClick={() => setView('weekly')}>
          주간
        </button>
        <button className={view === 'biweekly' ? 'active' : 'secondary'} onClick={() => setView('biweekly')}>
          격주
        </button>
        <button className={view === 'monthly' ? 'active' : 'secondary'} onClick={() => setView('monthly')}>
          월간
        </button>
        <button className={view === 'season' ? 'active' : 'secondary'} onClick={() => setView('season')}>
          이번 시즌
        </button>
      </div>

      {range && (
        <p className="hint">
          {range.from} ~ {range.to}
        </p>
      )}

      {loading ? (
        <p className="hint">불러오는 중...</p>
      ) : (
        <>
          <div className="summary-strip">
            <div className="summary-chip">
              <div className="num">{participants.length}명</div>
              <div className="lbl">참여 인원</div>
            </div>
            <div className="summary-chip">
              <div className="num">
                {participants.filter((p) => p.entry_count > 0).length}명
              </div>
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

          <div className="section-title-sm">참가자별 달성률</div>
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
      )}

      <div className="section-title-sm">공유 메모</div>
      {feedItems.length === 0 && <p className="hint">공유된 메모가 없습니다.</p>}
      {feedItems.map((item) => (
        <div className="feed-item" key={`${item.user_id}-${item.date}`}>
          <div className="meta">
            {item.display_name} · {item.date}
          </div>
          <div>{item.notes}</div>
        </div>
      ))}
    </div>
  )
}
