import { CalendarDays, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

/**
 * There is one signed-in screen, so there is no nav list: US-13 was dropped and
 * the agenda screen it would have linked to was never built. The lockup is the
 * wayfinding — it returns to the calendar.
 */
export function Nav() {
  const { email, signOut } = useAuth()

  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          to="/calendar"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-md font-semibold tracking-tight transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent focus-visible:outline-none"
        >
          <CalendarDays className="text-accent size-[18px]" strokeWidth={2} aria-hidden />
          Scheduler
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground hidden max-w-[22ch] truncate text-sm sm:inline">
            {email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
