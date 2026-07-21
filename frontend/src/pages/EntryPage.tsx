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
import { calcAchievementRate } from '../achievement'
import { clearParticipantSession, getParticipantSession } from '../auth'
import DdayBanner from '../components/DdayBanner'
import type { Entry, Goal, Season } from '../types'

const METHOD_PRESETS = ['인강', '문제집', '단어암기', '모의고사']
const TOPIC_PRESETS = ['문법', '어휘', '한자', '청해', '독해']

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function EntryPage() {
  const navigate = useNavigate()
  const session = getParticipantSession()!

  const [season, setSeason] = useState<Season | null>(null)
  const [date, setDate] = useState(todayStr())
  const [entry, setEntry] = useState<Entry | null>(null)
  const [entryLoading, setEntryLoading] = useState(false)

  const [studyMethod, setStudyMethod] = useState('')
  const [studyTopic, setStudyTopic] = useState('')
  const [amountValue, setAmountValue] = useState('')
  const [amountUnit, setAmountUnit] = useState('분')
  const [notes, setNotes] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [goal, setGoalState] = useState<Goal | null>(null)
  const [goalValue, setGoalValue] = useState('')
  const [goalUnit, setGoalUnit] = useState('분')
  const [goalMessage, setGoalMessage] = useState<string | null>(null)

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinMessage, setPinMessage] = useState<string | null>(null)

  useEffect(() => {
    currentSeason().then(setSeason).catch(() => setSeason(null))
    getGoal(session.user_id).then((g) => {
      setGoalState(g)
      if (g) {
        setGoalValue(String(g.value))
        setGoalUnit(g.unit)
      }
    })
  }, [session.user_id])

  useEffect(() => {
    setEntryLoading(true)
    setSaveError(null)
    getEntry(session.user_id, date, session.token)
      .then((e) => {
        setEntry(e)
        setStudyMethod(e.study_method.join(', '))
        setStudyTopic(e.study_topic.join(', '))
        setAmountValue(String(e.amount.value))
        setAmountUnit(e.amount.unit)
        setNotes(e.notes)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setEntry(null)
          setStudyMethod('')
          setStudyTopic('')
          setAmountValue('')
          setNotes('')
        } else {
          setSaveError('기록을 불러오지 못했습니다.')
        }
      })
      .finally(() => setEntryLoading(false))
  }, [date, session.user_id, session.token])

  const achievementRate = entry ? calcAchievementRate(entry.amount, entry.goal_snapshot) : null

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    if (!amountValue) {
      setSaveError('학습량을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const saved = await putEntry(
        session.user_id,
        date,
        {
          study_method: studyMethod.split(',').map((s) => s.trim()).filter(Boolean),
          study_topic: studyTopic.split(',').map((s) => s.trim()).filter(Boolean),
          amount: { value: Number(amountValue), unit: amountUnit },
          notes,
        },
        session.token,
      )
      setEntry(saved)
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
    setStudyMethod('')
    setStudyTopic('')
    setAmountValue('')
    setNotes('')
  }

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setGoalMessage(null)
    try {
      const g = await setGoal(session.user_id, { value: Number(goalValue), unit: goalUnit }, session.token)
      setGoalState(g)
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

      <h2>학습 기록</h2>
      <label htmlFor="date">날짜</label>
      <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />

      {entryLoading ? (
        <p className="hint">불러오는 중...</p>
      ) : (
        <form onSubmit={handleSaveEntry}>
          <label htmlFor="method">학습 수단 (쉼표로 구분)</label>
          <input
            id="method"
            list="method-presets"
            value={studyMethod}
            onChange={(e) => setStudyMethod(e.target.value)}
            placeholder="예: 인강, 문제집"
          />
          <datalist id="method-presets">
            {METHOD_PRESETS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <label htmlFor="topic">학습 내용 (쉼표로 구분)</label>
          <input
            id="topic"
            list="topic-presets"
            value={studyTopic}
            onChange={(e) => setStudyTopic(e.target.value)}
            placeholder="예: 문법, 어휘"
          />
          <datalist id="topic-presets">
            {TOPIC_PRESETS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>

          <label htmlFor="amount">학습량</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="amount"
              type="number"
              min="0"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              required
            />
            <input value={amountUnit} onChange={(e) => setAmountUnit(e.target.value)} placeholder="단위(분/페이지 등)" />
          </div>

          <label htmlFor="notes">메모 (격주 모임 공유용)</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {achievementRate !== null ? (
            <p className="hint">오늘 달성률: {achievementRate}%</p>
          ) : entry ? (
            <p className="hint">달성률 계산 불가 (목표 미설정 또는 단위 불일치)</p>
          ) : null}

          {saveError && <p className="error">{saveError}</p>}
          <button type="submit" disabled={saving}>
            {saving ? '저장 중...' : entry ? '수정 저장' : '기록 저장'}
          </button>
          {entry && (
            <button type="button" className="secondary" onClick={handleDeleteEntry}>
              이 날짜 기록 삭제
            </button>
          )}
        </form>
      )}

      <h2>목표 설정</h2>
      <form onSubmit={handleSaveGoal}>
        <label htmlFor="goal-value">하루 목표</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="goal-value"
            type="number"
            min="0"
            value={goalValue}
            onChange={(e) => setGoalValue(e.target.value)}
            required
          />
          <input value={goalUnit} onChange={(e) => setGoalUnit(e.target.value)} placeholder="단위" />
        </div>
        {goal && (
          <p className="hint">
            현재 목표: {goal.value}
            {goal.unit}/일
          </p>
        )}
        {goalMessage && <p className="hint">{goalMessage}</p>}
        <button type="submit">목표 저장</button>
      </form>

      <h2>PIN 변경</h2>
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
        <button type="submit">PIN 변경</button>
      </form>
    </div>
  )
}
