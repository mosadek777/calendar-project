import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, CalendarDays } from 'lucide-react'
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
    // bg-background underneath means a missing photograph degrades to the gradient
    // alone rather than to a white page.
    <div className="bg-background relative min-h-svh w-full overflow-hidden">
      <img
        src="/auth-bg.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />

      {/* Base wash: keeps text readable anywhere on the photograph. */}
      <div className="from-background/75 via-background/55 to-background/85 absolute inset-0 bg-gradient-to-b" />

      {/* Stronger on the side the form sits: rightwards from lg, downwards below it,
          so the panel always has something calm underneath. */}
      <div className="to-background/80 absolute inset-0 bg-gradient-to-b from-transparent via-transparent lg:bg-gradient-to-r lg:via-transparent" />

      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col items-center justify-center gap-12 px-5 py-14 lg:flex-row lg:justify-between lg:gap-20 lg:px-8">
        {/* Directly on the photograph — no panel behind it. */}
        <div className="w-full max-w-lg lg:flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white drop-shadow-sm">
            <CalendarDays className="text-accent size-[18px]" strokeWidth={2} aria-hidden />
            Scheduler
          </span>

          <h2 className="mt-8 text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-white drop-shadow-md sm:text-4xl lg:text-5xl">
            Your days, quietly in order.
          </h2>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 drop-shadow-sm">
            Pick a day, see what is on it, and get on with the rest.
          </p>
        </div>

        {/* Frosted glass: floating above the image rather than cut out of it. */}
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.07] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8 lg:w-[26rem] lg:shrink-0">
          <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-white/60">{description}</p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs text-white/70">
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
                className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-white/25"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-xs text-white/70">
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
                className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-white/25"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="border-destructive/40 bg-destructive/15 text-destructive flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm backdrop-blur-sm"
              >
                <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full bg-white font-medium text-neutral-950 transition-transform hover:bg-white/90 active:scale-[0.99]"
            >
              {busy ? 'Please wait…' : submitLabel}
            </Button>

            <p className="text-center text-sm text-white/60">
              {footer.prompt}{' '}
              <Link
                to={footer.to}
                className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
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
