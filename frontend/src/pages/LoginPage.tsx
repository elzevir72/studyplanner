import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, listUsers, verifyPin } from '../api/client'
import { setParticipantSession } from '../auth'
import type { UserSummary } from '../types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [userId, setUserId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listUsers()
      .then((list) => {
        setUsers(list)
        if (list.length > 0) setUserId(list[0].user_id)
      })
      .catch(() => setError('참가자 목록을 불러오지 못했습니다.'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await verifyPin(userId, pin)
      setParticipantSession(result)
      navigate('/entry')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Study Planner</h1>
      <p className="hint">이름을 선택하고 PIN을 입력하세요.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="user">이름</label>
        <select id="user" value={userId} onChange={(e) => setUserId(e.target.value)} required>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.display_name}
            </option>
          ))}
        </select>

        <label htmlFor="pin">PIN (4자리)</label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading || !userId}>
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </form>
    </div>
  )
}
