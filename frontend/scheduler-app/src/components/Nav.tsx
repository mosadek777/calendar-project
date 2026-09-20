import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

/** Moves between the agenda and the calendar, the two screens of clarification Q4. */
export function Nav() {
  const { email, signOut } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <nav className="flex gap-1">
        <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'} size="sm">
          <Link to="/">Today</Link>
        </Button>
        <Button asChild variant={pathname === '/calendar' ? 'secondary' : 'ghost'} size="sm">
          <Link to="/calendar">Calendar</Link>
        </Button>
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground hidden text-sm sm:inline">{email}</span>
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
