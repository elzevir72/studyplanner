import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ApiError,
  changePin,
  currentSeason,
  deleteEntry,
  getEntry,
  getGoal,
  putEntry,
  setGoal,
} from '../api/client'
import { calcEntryAchievementRate } from '../achievement'
import { clearParticipantSession, getParticipantSession } from '../auth'
import DdayBanner from '../components/DdayBanner'
import type { Entry, MethodGoal, Season, StudyItem } from '../types'

const METHOD_PRESETS = ['인강', '문제집', '단어암기', '모의고사']
const TOPIC_PRESETS = ['문법', '어휘', '한자', '청해', '독해']

// 수단별 학습량 입력 방식.
// - time: 시간/분으로 입력받아 분(unit="분")으로 환산
// - fraction: 분수형(맞은 개수/전체 문항 수), unit="문항" 고정 — 기록은 맞은 개수, 목표는 전체 문항 수
// - fixedUnit: 수량 입력 + 단위 자동 고정 (사용자가 매번 단위를 타이핑할 필요 없음)
// - free: 수량 + 자유 단위 입력 (프리셋에 없는 수단 직접 입력 시)
type AmountKind = 'time' | 'fraction' | 'fixedUnit' | 'free'

const METHOD_AMOUNT_KIND: Record<string, AmountKind> = {
  인강: 'time',
  모의고사: 'fraction',
  문제집: 'fixedUnit',
  단어암기: 'fixedUnit',
}

const METHOD_FIXED_UNIT: Record<string, string> = {
  문제집: '페이지',
  단어암기: '개',
}

function amountKindOf(method: string): AmountKind {
  return METHOD_AMOUNT_KIND[method] ?? 'free'
}

function defaultAmountFor(method: string): { value: number; unit: string } {
  const kind = amountKindOf(method)
  if (kind === 'time') return { value: 0, unit: '분' }
  if (kind === 'fraction') return { value: 0, unit: '문항' }
  if (kind === 'fixedUnit') return { value: 0, unit: METHOD_FIXED_UNIT[method] }
  return { value: 0, unit: '' }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyStudyItem(): StudyItem {
  return { method: '', topics: [], amount: { value: 0, unit: '' } }
}

function toggleTopic(topics: string[], topic: string): string[] {
  return topics.includes(topic) ? topics.filter((t) => t !== topic) : [...topics, topic]
}

function minutesToHm(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

export default function EntryPage() {
  const navigate = useNavigate()
  const session = getParticipantSession()!

  const [season, setSeason] = useState<Season | null>(null)
  const [date, setDate] = useState(todayStr())
  const [entry, setEntry] = useState<Entry | null>(null)
  const [entryLoading, setEntryLoading] = useState(false)

  const [studyItems, setStudyItems] = useState<StudyItem[]>([emptyStudyItem()])
  const [notes, setNotes] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [goals, setGoals] = useState<MethodGoal[]>([])
  const [goalMessage, setGoalMessage] = useState<string | null>(null)

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinMessage, setPinMessage] = useState<string | null>(null)

  useEffect(() => {
    currentSeason().then(setSeason).catch(() => setSeason(null))
    getGoal(session.user_id).then((g) => setGoals(g ?? []))
  }, [session.user_id])

  useEffect(() => {
    setEntryLoading(true)
    setSaveError(null)
    getEntry(session.user_id, date, session.token)
      .then((e) => {
        setEntry(e)
        setStudyItems(e.study_items.length > 0 ? e.study_items : [emptyStudyItem()])
        setNotes(e.notes)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setEntry(null)
          setStudyItems([emptyStudyItem()])
          setNotes('')
        } else {
          setSaveError('기록을 불러오지 못했습니다.')
        }
      })
      .finally(() => setEntryLoading(false))
  }, [date, session.user_id, session.token])

  const achievementRate = entry ? calcEntryAchievementRate(entry.study_items, entry.goal_snapshot) : null

  const updateItem = (index: number, patch: Partial<StudyItem>) => {
    setStudyItems((items) =>
      items.map((item, i) => {
        if (i !== index) return item
        const next = { ...item, ...patch }
        // 수단이 바뀌면 그 수단에 맞는 학습량 입력 방식(시간/분수/고정단위)으로 리셋
        if (patch.method !== undefined && patch.method !== item.method) {
          next.amount = defaultAmountFor(patch.method)
        }
        return next
      }),
    )
  }

  const addStudyItem = () => setStudyItems((items) => [...items, emptyStudyItem()])
  const removeStudyItem = (index: number) => setStudyItems((items) => items.filter((_, i) => i !== index))

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    const validItems = studyItems.filter((item) => item.method && item.amount.value > 0)
    if (validItems.length === 0) {
      setSaveError('학습 수단과 학습량을 하나 이상 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const saved = await putEntry(session.user_id, date, { study_items: validItems, notes }, session.token)
      setEntry(saved)
      alert('저장이 완료되었습니다.')
      navigate('/dashboard')
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!entry) return
    if (!confirm('이 날짜의 기록을 삭제할까요?')) return
    await deleteEntry(session.user_id, date, session.token)
    setEntry(null)
    setStudyItems([emptyStudyItem()])
    setNotes('')
  }

  const updateGoal = (index: number, patch: Partial<MethodGoal>) => {
    setGoals((gs) =>
      gs.map((g, i) => {
        if (i !== index) return g
        const next = { ...g, ...patch }
        if (patch.method !== undefined && patch.method !== g.method) {
          const { unit } = defaultAmountFor(patch.method)
          next.unit = unit
        }
        return next
      }),
    )
  }
  const addGoal = () => setGoals((gs) => [...gs, { method: '', value: 0, unit: '' }])
  const removeGoal = (index: number) => setGoals((gs) => gs.filter((_, i) => i !== index))

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setGoalMessage(null)
    const validGoals = goals.filter((g) => g.method && g.value > 0)
    if (validGoals.length === 0) {
      setGoalMessage('수단과 목표량을 하나 이상 입력해주세요.')
      return
    }
    try {
      const saved = await setGoal(session.user_id, validGoals, session.token)
      setGoals(saved)
      setGoalMessage('목표가 저장되었습니다.')
    } catch (err) {
      setGoalMessage(err instanceof ApiError ? err.message : '목표 저장에 실패했습니다.')
    }
  }

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinMessage(null)
    try {
      await changePin(session.user_id, currentPin, newPin, session.token)
      setCurrentPin('')
      setNewPin('')
      setPinMessage('PIN이 변경되었습니다.')
    } catch (err) {
      setPinMessage(err instanceof ApiError ? err.message : 'PIN 변경에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    clearParticipantSession()
    navigate('/')
  }

  return (
    <div>
      <nav>
        <span style={{ flex: 1, alignSelf: 'center' }}>{session.display_name}님</span>
        <a href="/dashboard">대시보드</a>
        <button className="secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </nav>

      <DdayBanner season={season} />

      {entryLoading ? (
        <p className="hint">불러오는 중...</p>
      ) : (
        <form onSubmit={handleSaveEntry}>
          <div className="today-card">
            <span className="today-label">{date === todayStr() ? '오늘 기록' : `${date} 기록`}</span>

            {studyItems.map((item, index) => (
              <div className="study-item-block" key={index}>
                <label>학습 수단</label>
                <div className="tag-select">
                  {METHOD_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`tag-btn${item.method === m ? ' selected' : ''}`}
                      onClick={() => updateItem(index, { method: m })}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  value={item.method}
                  onChange={(e) => updateItem(index, { method: e.target.value })}
                  placeholder="목록에 없으면 직접 입력"
                />

                <label>학습 내용 (여러 개 선택 가능)</label>
                <div className="tag-select">
                  {TOPIC_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`tag-btn${item.topics.includes(t) ? ' selected' : ''}`}
                      onClick={() => updateItem(index, { topics: toggleTopic(item.topics, t) })}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <label>학습량</label>
                {(() => {
                  const kind = amountKindOf(item.method)
                  if (kind === 'time') {
                    return (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            value={minutesToHm(item.amount.value).hours || ''}
                            onChange={(e) => {
                              const { minutes } = minutesToHm(item.amount.value)
                              const hours = Number(e.target.value) || 0
                              updateItem(index, { amount: { value: hours * 60 + minutes, unit: '분' } })
                            }}
                          />
                          <span className="hint">시간</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutesToHm(item.amount.value).minutes || ''}
                            onChange={(e) => {
                              const { hours } = minutesToHm(item.amount.value)
                              const minutes = Number(e.target.value) || 0
                              updateItem(index, { amount: { value: hours * 60 + minutes, unit: '분' } })
                            }}
                          />
                          <span className="hint">분</span>
                        </div>
                      </div>
                    )
                  }
                  if (kind === 'fraction') {
                    const totalGoal = goals.find((g) => g.method === item.method)
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          value={item.amount.value || ''}
                          onChange={(e) => updateItem(index, { amount: { value: Number(e.target.value), unit: '문항' } })}
                          style={{ flex: 1 }}
                        />
                        <span className="hint">맞은 개수 / 전체 {totalGoal ? totalGoal.value : '?'}문항</span>
                      </div>
                    )
                  }
                  if (kind === 'fixedUnit') {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          value={item.amount.value || ''}
                          onChange={(e) => updateItem(index, { amount: { ...item.amount, value: Number(e.target.value) } })}
                          style={{ flex: 1 }}
                        />
                        <span className="hint">{item.amount.unit}</span>
                      </div>
                    )
                  }
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          value={item.amount.value || ''}
                          onChange={(e) => updateItem(index, { amount: { ...item.amount, value: Number(e.target.value) } })}
                        />
                        <span className="hint">수량</span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          value={item.amount.unit}
                          onChange={(e) => updateItem(index, { amount: { ...item.amount, unit: e.target.value } })}
                          placeholder="예: 페이지, 개"
                        />
                        <span className="hint">단위</span>
                      </div>
                    </div>
                  )
                })()}

                {studyItems.length > 1 && (
                  <button type="button" className="secondary" onClick={() => removeStudyItem(index)}>
                    이 수단 삭제
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="secondary" onClick={addStudyItem}>
              + 학습 수단 추가
            </button>

            {achievementRate !== null ? (
              <p className="progress-hint">오늘 달성률 {achievementRate}%</p>
            ) : entry ? (
              <p className="progress-hint">달성률 계산 불가 (목표 미설정 또는 단위 불일치)</p>
            ) : null}

            <label htmlFor="notes">메모 (격주 모임 공유용)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

            {saveError && <p className="error">{saveError}</p>}
            <button type="submit" disabled={saving}>
              {saving ? '저장 중...' : entry ? '수정 저장' : '기록 저장'}
            </button>
            {entry && (
              <button type="button" className="secondary" onClick={handleDeleteEntry}>
                이 날짜 기록 삭제
              </button>
            )}
          </div>
        </form>
      )}

      <details className="accordion">
        <summary>다른 날짜 기록 보기 / 수정</summary>
        <div className="acc-body">
          <label htmlFor="date">날짜</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />
        </div>
      </details>

      <details className="accordion">
        <summary>목표 설정</summary>
        <div className="acc-body">
          <form onSubmit={handleSaveGoal}>
            {goals.map((g, index) => (
              <div className="study-item-block" key={index}>
                <label>수단</label>
                <div className="tag-select">
                  {METHOD_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`tag-btn${g.method === m ? ' selected' : ''}`}
                      onClick={() => updateGoal(index, { method: m })}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  value={g.method}
                  onChange={(e) => updateGoal(index, { method: e.target.value })}
                  placeholder="목록에 없으면 직접 입력"
                />
                <label>목표량</label>
                {(() => {
                  const kind = amountKindOf(g.method)
                  if (kind === 'time') {
                    return (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            value={minutesToHm(g.value).hours || ''}
                            onChange={(e) => {
                              const { minutes } = minutesToHm(g.value)
                              const hours = Number(e.target.value) || 0
                              updateGoal(index, { value: hours * 60 + minutes, unit: '분' })
                            }}
                          />
                          <span className="hint">시간</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutesToHm(g.value).minutes || ''}
                            onChange={(e) => {
                              const { hours } = minutesToHm(g.value)
                              const minutes = Number(e.target.value) || 0
                              updateGoal(index, { value: hours * 60 + minutes, unit: '분' })
                            }}
                          />
                          <span className="hint">분</span>
                        </div>
                      </div>
                    )
                  }
                  if (kind === 'fraction') {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          value={g.value || ''}
                          onChange={(e) => updateGoal(index, { value: Number(e.target.value), unit: '문항' })}
                          style={{ flex: 1 }}
                        />
                        <span className="hint">전체 문항 수</span>
                      </div>
                    )
                  }
                  if (kind === 'fixedUnit') {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          value={g.value || ''}
                          onChange={(e) => updateGoal(index, { value: Number(e.target.value) })}
                          style={{ flex: 1 }}
                        />
                        <span className="hint">{g.unit}</span>
                      </div>
                    )
                  }
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          value={g.value || ''}
                          onChange={(e) => updateGoal(index, { value: Number(e.target.value) })}
                        />
                        <span className="hint">수량</span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          value={g.unit}
                          onChange={(e) => updateGoal(index, { unit: e.target.value })}
                          placeholder="예: 페이지, 개"
                        />
                        <span className="hint">단위</span>
                      </div>
                    </div>
                  )
                })()}
                <button type="button" className="secondary" onClick={() => removeGoal(index)}>
                  이 목표 삭제
                </button>
              </div>
            ))}
            <button type="button" className="secondary" onClick={addGoal}>
              + 수단별 목표 추가
            </button>
            {goalMessage && <p className="hint">{goalMessage}</p>}
            <button type="submit">목표 저장</button>
          </form>
        </div>
      </details>

      <details className="accordion">
        <summary>계정 설정 (PIN 변경)</summary>
        <div className="acc-body">
          <form onSubmit={handleChangePin}>
            <label htmlFor="current-pin">현재 PIN</label>
            <input
              id="current-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
            <label htmlFor="new-pin">새 PIN</label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
            />
            {pinMessage && <p className="hint">{pinMessage}</p>}
            <button type="submit" className="secondary">
              PIN 변경
            </button>
          </form>
        </div>
      </details>
    </div>
  )
}
