import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { pageTransition } from '@/lib/motion'
import { CalendarPage } from '@/pages/CalendarPage'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

/**
 * Temporary landing screen so the auth story (US-09) is demonstrable on its own.
 * US-13 was dropped, so both auth pages redirect to /calendar and this is reachable
 * only through the Today link.
 */
function SignedInPlaceholder() {
  const { email, signOut } = useAuth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <CalendarDays className="text-accent size-6" aria-hidden />
      <div>
        <p className="text-muted-foreground text-sm">Signed in as</p>
        <p className="mt-1 text-lg font-medium">{email}</p>
      </div>
      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    // Page transition: one of the two motion cases Article VII permits.
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} {...pageTransition}>
        <Routes location={location}>
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
      </motion.div>
    </AnimatePresence>
  )
}
