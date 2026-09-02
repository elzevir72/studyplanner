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
import Button from '../components/Button'
import Card from '../components/Card'
import FormField from '../components/FormField'
import TagSelect from '../components/TagSelect'
import Message from '../components/Message'
import Accordion from '../components/Accordion'
import CollapsibleStudyItem from '../components/CollapsibleStudyItem'
import LoadingPlaceholder from '../components/LoadingPlaceholder'
import Toast from '../components/Toast'
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

function minutesToHm(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

// 저장 시 유효성 기준(method && amount.value > 0)과 동일 — 접힘 가능 여부 판정에도 그대로 재사용한다.
function isStudyItemComplete(item: StudyItem): boolean {
  return Boolean(item.method) && item.amount.value > 0
}

function formatAmount(amount: { value: number; unit: string }): string {
  if (amount.unit === '분') {
    const { hours, minutes } = minutesToHm(amount.value)
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`
  }
  return `${amount.value}${amount.unit}`
}

function studyItemSummary(item: StudyItem): string {
  return [item.method, item.topics.join(','), formatAmount(item.amount)].filter(Boolean).join(' · ')
}

export default function EntryPage() {
  const navigate = useNavigate()
  const session = getParticipantSession()!

  const [season, setSeason] = useState<Season | null>(null)
  const [date, setDate] = useState(todayStr())
  const [entry, setEntry] = useState<Entry | null>(null)
  const [entryLoading, setEntryLoading] = useState(false)

  const [studyItems, setStudyItems] = useState<StudyItem[]>([emptyStudyItem()])
  const [collapsedIndexes, setCollapsedIndexes] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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
        const items = e.study_items.length > 0 ? e.study_items : [emptyStudyItem()]
        setStudyItems(items)
        // 저장된 기록을 불러올 때는 완료된 항목을 전부 접힌 채로 시작 — 요약줄만 훑어보고 필요한 것만 펼쳐 수정
        setCollapsedIndexes(new Set(items.map((item, i) => (isStudyItemComplete(item) ? i : -1)).filter((i) => i >= 0)))
        setNotes(e.notes)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setEntry(null)
          setStudyItems([emptyStudyItem()])
          setCollapsedIndexes(new Set())
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
        // 수단이 바뀌면(TagSelect 재클릭으로 빈 값이 된 경우 포함) 그 수단에 맞는 학습량 입력 방식으로 리셋
        if (patch.method !== undefined && patch.method !== item.method) {
          next.amount = defaultAmountFor(patch.method)
        }
        return next
      }),
    )
  }

  const addStudyItem = () => {
    // 새 수단을 추가하는 시점에, 완료된(수단+학습량 입력된) 기존 항목들만 접는다 — 미완료 항목은 그대로 펼쳐진 채 유지
    setCollapsedIndexes((prev) => {
      const next = new Set(prev)
      studyItems.forEach((item, i) => {
        if (isStudyItemComplete(item)) next.add(i)
      })
      return next
    })
    setStudyItems((items) => [...items, emptyStudyItem()])
  }

  const removeStudyItem = (index: number) => {
    setStudyItems((items) => items.filter((_, i) => i !== index))
    // 인덱스가 하나씩 당겨지므로 접힘 상태도 함께 재계산
    setCollapsedIndexes((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const toggleCollapsed = (index: number, collapsed: boolean) => {
    setCollapsedIndexes((prev) => {
      const next = new Set(prev)
      if (collapsed) next.add(index)
      else next.delete(index)
      return next
    })
  }

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
      navigate('/dashboard', { state: { toast: '저장이 완료되었습니다.' } })
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
    setCollapsedIndexes(new Set())
    setNotes('')
    setToastMessage('삭제가 완료되었습니다.')
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

  function renderAmountFields(
    method: string,
    amount: { value: number; unit: string },
    onAmountChange: (amount: { value: number; unit: string }) => void,
    fractionHint: string,
  ) {
    const kind = amountKindOf(method)
    if (kind === 'time') {
      const { hours, minutes } = minutesToHm(amount.value)
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min="0"
              value={hours || ''}
              onChange={(e) => onAmountChange({ value: (Number(e.target.value) || 0) * 60 + minutes, unit: '분' })}
            />
            <span className="hint">시간</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes || ''}
              onChange={(e) => onAmountChange({ value: hours * 60 + (Number(e.target.value) || 0), unit: '분' })}
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
            value={amount.value || ''}
            onChange={(e) => onAmountChange({ value: Number(e.target.value), unit: '문항' })}
            style={{ flex: 1 }}
          />
          <span className="hint">{fractionHint}</span>
        </div>
      )
    }
    if (kind === 'fixedUnit') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min="0"
            value={amount.value || ''}
            onChange={(e) => onAmountChange({ ...amount, value: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span className="hint">{amount.unit}</span>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min="0"
            value={amount.value || ''}
            onChange={(e) => onAmountChange({ ...amount, value: Number(e.target.value) })}
          />
          <span className="hint">수량</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            value={amount.unit}
            onChange={(e) => onAmountChange({ ...amount, unit: e.target.value })}
            placeholder="예: 페이지, 개"
          />
          <span className="hint">단위</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
      <nav>
        <span className="nav-title">{session.display_name}님</span>
        <a href="/dashboard">대시보드</a>
        <Button variant="secondary" onClick={handleLogout}>
          로그아웃
        </Button>
      </nav>

      <DdayBanner season={season} />

      {entryLoading ? (
        <LoadingPlaceholder label="기록 불러오는 중..." />
      ) : (
        <form onSubmit={handleSaveEntry}>
          <Card variant="highlight">
            <span className="today-label">{date === todayStr() ? '오늘 기록' : `${date} 기록`}</span>

            {studyItems.map((item, index) => (
              <CollapsibleStudyItem
                key={index}
                collapsed={collapsedIndexes.has(index)}
                onToggle={(collapsed) => toggleCollapsed(index, collapsed)}
                summary={studyItemSummary(item)}
              >
                <FormField label="학습 수단">
                  <TagSelect
                    options={METHOD_PRESETS}
                    selected={item.method ? [item.method] : []}
                    onChange={(next) => updateItem(index, { method: next[0] ?? '' })}
                  />
                  <input
                    value={item.method}
                    onChange={(e) => updateItem(index, { method: e.target.value })}
                    placeholder="목록에 없으면 직접 입력"
                  />
                </FormField>

                <FormField label="학습 내용 (여러 개 선택 가능)">
                  <TagSelect
                    options={TOPIC_PRESETS}
                    selected={item.topics}
                    multiple
                    onChange={(next) => updateItem(index, { topics: next })}
                  />
                </FormField>

                <FormField label="학습량">
                  {renderAmountFields(
                    item.method,
                    item.amount,
                    (amount) => updateItem(index, { amount }),
                    `맞은 개수 / 전체 ${goals.find((g) => g.method === item.method)?.value ?? '?'}문항`,
                  )}
                </FormField>

                {studyItems.length > 1 && (
                  <Button variant="secondary" onClick={() => removeStudyItem(index)}>
                    이 수단 삭제
                  </Button>
                )}
              </CollapsibleStudyItem>
            ))}

            <Button variant="secondary" onClick={addStudyItem}>
              + 학습 수단 추가
            </Button>

            {achievementRate !== null ? (
              <Message kind="success">오늘 달성률 {achievementRate}%</Message>
            ) : entry ? (
              <Message kind="hint">달성률 계산 불가 (목표 미설정 또는 단위 불일치)</Message>
            ) : null}

            <FormField label="메모 (오프라인 모임 공유용)" htmlFor="notes">
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>

            {saveError && <Message kind="error">{saveError}</Message>}
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : entry ? '수정 저장' : '기록 저장'}
            </Button>
            {entry && (
              <Button variant="secondary" onClick={handleDeleteEntry}>
                이 날짜 기록 삭제
              </Button>
            )}
          </Card>
        </form>
      )}

      <Accordion summary="다른 날짜 기록 보기 / 수정">
        <FormField label="날짜" htmlFor="date">
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />
        </FormField>
      </Accordion>

      <Accordion summary="목표 설정">
        <form onSubmit={handleSaveGoal}>
          {goals.map((g, index) => (
            <div className="study-item-block" key={index}>
              <FormField label="수단">
                <TagSelect
                  options={METHOD_PRESETS}
                  selected={g.method ? [g.method] : []}
                  onChange={(next) => updateGoal(index, { method: next[0] ?? '' })}
                />
                <input
                  value={g.method}
                  onChange={(e) => updateGoal(index, { method: e.target.value })}
                  placeholder="목록에 없으면 직접 입력"
                />
              </FormField>
              <FormField label="목표량">
                {renderAmountFields(
                  g.method,
                  { value: g.value, unit: g.unit },
                  (amount) => updateGoal(index, { value: amount.value, unit: amount.unit }),
                  '전체 문항 수',
                )}
              </FormField>
              <Button variant="secondary" onClick={() => removeGoal(index)}>
                이 목표 삭제
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={addGoal}>
            + 수단별 목표 추가
          </Button>
          {goalMessage && <Message kind="hint">{goalMessage}</Message>}
          <Button type="submit">목표 저장</Button>
        </form>
      </Accordion>

      <Accordion summary="계정 설정 (PIN 변경)">
        <form onSubmit={handleChangePin}>
          <FormField label="현재 PIN" htmlFor="current-pin">
            <input
              id="current-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
          </FormField>
          <FormField label="새 PIN" htmlFor="new-pin">
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
            />
          </FormField>
          {pinMessage && <Message kind="hint">{pinMessage}</Message>}
          <Button type="submit" variant="secondary">
            PIN 변경
          </Button>
        </form>
      </Accordion>
    </div>
  )
}
