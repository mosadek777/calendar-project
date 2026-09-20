import { CalendarDays, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { cn } from 'cn'

/** Moves between the agenda and the calendar, the two screens of clarification Q4. */
export function Nav() {
  const { email, signOut } = useAuth()
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Today' },
    { to: '/calendar', label: 'Calendar' },
  ]

  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <CalendarDays className="text-accent size-[18px]" strokeWidth={2} aria-hidden />
            Scheduler
          </span>

          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'focus-visible:ring-ring relative rounded-md px-2.5 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover',
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="bg-accent absolute inset-x-2.5 -bottom-[11px] h-px" aria-hidden />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

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
