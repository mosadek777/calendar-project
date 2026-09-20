import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, CalendarDays, Lock, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AuthFormProps {
  title: string
  description: string
  submitLabel: string
  onSubmit: (email: string, password: string) => Promise<void>
  footer: { prompt: string; linkLabel: string; to: string }
}

const points = [
  { icon: CalendarDays, text: 'See your whole month at a glance' },
  { icon: Mail, text: 'Send any day’s schedule to your inbox' },
  { icon: Lock, text: 'Your appointments are visible only to you' },
]

/** Shared by Login and Register — the two differ only in their labels and handler. */
export function AuthForm({ title, description, submitLabel, onSubmit, footer }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      await onSubmit(email, password)
    } catch (caught) {
      // Show what the server said, never a message of our own invention.
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="border-border bg-card grid w-full max-w-4xl overflow-hidden rounded-xl border md:grid-cols-2">
        {/* Quiet brand panel. Drops away below md, where the lockup above the form
            carries the identity instead. */}
        <aside className="border-border hidden flex-col justify-between gap-10 border-r p-8 md:flex">
          <div>
            <span className="flex items-center gap-2 font-semibold tracking-tight">
              <CalendarDays className="text-accent size-[18px]" strokeWidth={2} aria-hidden />
              Scheduler
            </span>
            <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
              A calendar that stays out of the way. Pick a day, see what is on it, and get on
              with the rest.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="text-muted-foreground flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-6 sm:p-8">
          <span className="mb-8 flex items-center gap-2 font-semibold tracking-tight md:hidden">
            <CalendarDays className="text-accent size-[18px]" strokeWidth={2} aria-hidden />
            Scheduler
          </span>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/60 h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/60 h-11"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm"
              >
                <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full font-medium transition-transform active:scale-[0.99]"
            >
              {busy ? 'Please wait…' : submitLabel}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              {footer.prompt}{' '}
              <Link
                to={footer.to}
                className="text-foreground decoration-border hover:decoration-foreground underline underline-offset-4 transition-colors"
              >
                {footer.linkLabel}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
