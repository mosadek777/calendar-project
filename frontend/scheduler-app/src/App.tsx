import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { CalendarPage } from '@/pages/CalendarPage'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

/**
 * Temporary landing screen so the auth story (US-09) is demonstrable on its own.
 * Replaced by the calendar screen at T-52 and the agenda screen at T-67.
 */
function SignedInPlaceholder() {
  const { email, signOut } = useAuth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground text-sm">Signed in as</p>
      <p className="text-lg font-medium">{email}</p>
      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Open */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Everything else requires a session */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<SignedInPlaceholder />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
