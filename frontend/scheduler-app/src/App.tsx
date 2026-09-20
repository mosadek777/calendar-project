import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { pageTransition } from '@/lib/motion'
import { CalendarPage } from '@/pages/CalendarPage'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

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

          {/* Everything else requires a session. `/` is not a screen: US-13 was
              dropped, so it forwards to the calendar rather than leaving a dead
              end behind. Staying inside the guard means a signed-out visitor is
              still sent to /login rather than bounced through here. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
