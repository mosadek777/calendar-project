import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * The client-side half of FR-007. The server enforces the same rule with
 * [Authorize]; this exists so the person sees a sign-in screen instead of a
 * screen full of failed requests.
 */
export function ProtectedRoute() {
  const { isSignedIn } = useAuth()

  return isSignedIn ? <Outlet /> : <Navigate to="/login" replace />
}
