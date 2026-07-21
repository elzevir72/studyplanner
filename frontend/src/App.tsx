import { Navigate, Route, Routes } from 'react-router-dom'
import { getParticipantSession } from './auth'
import LoginPage from './pages/LoginPage'
import EntryPage from './pages/EntryPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

function RequireParticipant({ children }: { children: JSX.Element }) {
  const session = getParticipantSession()
  return session ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/entry"
        element={
          <RequireParticipant>
            <EntryPage />
          </RequireParticipant>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireParticipant>
            <DashboardPage />
          </RequireParticipant>
        }
      />
      {/* 관리자 화면은 참가자 흐름과 완전히 분리된 경로 — 메인 네비게이션에 링크를 두지 않는다 */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
