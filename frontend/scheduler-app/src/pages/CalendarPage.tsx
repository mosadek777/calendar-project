import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import { AppointmentForm } from '@/components/AppointmentForm'
import { AppointmentList } from '@/components/AppointmentList'
import { Nav } from '@/components/Nav'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { api } from '@/lib/api'
import { endOfMonth, formatLongDate, fromIsoDate, startOfMonth, toIsoDate } from '@/lib/dates'
import type { AppointmentResponse } from '@/lib/types'

export function CalendarPage() {
  const today = useMemo(() => new Date(), [])

  const [month, setMonth] = useState<Date>(() => startOfMonth(today))
  const [selected, setSelected] = useState<Date>(today)
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  /** null while creating; an appointment while editing. One form, two modes. */
  const [editing, setEditing] = useState<AppointmentResponse | null>(null)
  /** The appointment awaiting delete confirmation. */
  const [pendingDelete, setPendingDelete] = useState<AppointmentResponse | null>(null)
  /** Drives the button's disabled state and its label. */
  const [emailing, setEmailing] = useState(false)
  const [emailResult, setEmailResult] = useState<string | null>(null)

  /**
   * The actual re-entry guard. `disabled={emailing}` alone loses the race: setting
   * state does not apply the attribute until React re-renders, and a fast
   * double-click delivers its second event before that commit — which sent two
   * emails. A ref is written synchronously, so the second click cannot get past it.
   */
  const sendingRef = useRef(false)

  /** One range call per displayed month — the same endpoint the agenda uses. */
  const loadMonth = useCallback(async (visibleMonth: Date) => {
    setLoading(true)
    setError(null)

    try {
      const from = toIsoDate(startOfMonth(visibleMonth))
      const to = toIsoDate(endOfMonth(visibleMonth))
      setAppointments(await api.getRange(from, to))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load your appointments.')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMonth(month)
  }, [loadMonth, month])

  /** The distinct dates that hold at least one appointment, as "yyyy-MM-dd". */
  const busyDates = useMemo(
    () => [...new Set(appointments.map((a) => a.date))].sort(),
    [appointments],
  )

  /** The days react-day-picker should mark. */
  const busyDays = useMemo(() => busyDates.map(fromIsoDate), [busyDates])

  /**
   * react-day-picker memoises its day data with deliberately narrow dependencies
   * (see useCalendar), so handing it a fresh `modifiers` array is not enough to
   * re-mark the grid — only a month change or a remount rebuilds it. Keying the
   * calendar on the busy set forces that rebuild the moment the set changes, which
   * is what makes a newly created appointment mark its day without a reload.
   * `month` and `selected` are controlled, so the remount is invisible.
   */
  const busyKey = busyDates.join(',')

  const selectedIso = toIsoDate(selected)
  const selectedAppointments = appointments.filter((a) => a.date === selectedIso)
  const isToday = selectedIso === toIsoDate(today)

  const addButton = (
    <Button
      size="sm"
      className="gap-1.5 font-medium transition-transform active:scale-[0.98]"
      onClick={() => {
        setEditing(null)
        setFormOpen(true)
      }}
    >
      <Plus className="size-4" aria-hidden />
      Add
    </Button>
  )

  return (
    <div className="min-h-svh">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Month */}
          <section className="border-border bg-card rounded-xl border p-2 sm:p-3 lg:sticky lg:top-20 lg:w-auto lg:shrink-0">
            <Calendar
              key={busyKey}
              mode="single"
              selected={selected}
              onSelect={(day) => {
                if (!day) return
                setSelected(day)
                // A result from one day must not linger over another.
                setEmailResult(null)
              }}
              month={month}
              onMonthChange={setMonth}
              showOutsideDays
              modifiers={{ busy: busyDays }}
              className="bg-transparent [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(11)]"
              classNames={{
                month_caption: 'flex h-9 items-center px-2',
                caption_label: 'text-sm font-medium tracking-tight',
                weekday:
                  'text-muted-foreground label-caps flex-1 select-none rounded-md pb-2',
                outside: 'text-muted-foreground/35',
                today: 'text-accent font-semibold',
              }}
              modifiersClassNames={{
                // Busy days are filled and carry a dot beneath the numeral —
                // the same device as the reference month picker.
                busy: "relative bg-secondary/70 font-medium after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-accent after:content-['']",
              }}
            />
          </section>

          {/* The selected day */}
          <section className="border-border bg-card min-w-0 flex-1 rounded-xl border">
            <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="border-border bg-background/60 flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border">
                  <span className="text-muted-foreground label-caps leading-none">
                    {selected.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="tnum mt-0.5 text-lg leading-none font-semibold">
                    {selected.getDate()}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-base font-semibold tracking-tight">
                      {selected.toLocaleDateString(undefined, { weekday: 'long' })}
                    </h1>
                    {isToday && (
                      <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 text-[0.6875rem] font-medium">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {formatLongDate(selected)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Sends whichever day is selected. Pressing it on arrival sends
                    today, because the calendar opens with today selected. */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={emailing}
                  className="gap-1.5 transition-transform active:scale-[0.98]"
                  onClick={async () => {
                    // Synchronous, before any await — this is what actually stops a
                    // second click, since `disabled` has not been applied yet.
                    if (sendingRef.current) return
                    sendingRef.current = true

                    setEmailing(true)
                    setEmailResult(null)
                    try {
                      const result = await api.emailDay(selectedIso)
                      setEmailResult(result.message)
                    } catch (caught) {
                      setEmailResult(
                        caught instanceof Error ? caught.message : 'The email could not be sent.',
                      )
                    } finally {
                      // Released on settle, whether the send succeeded or failed.
                      sendingRef.current = false
                      setEmailing(false)
                    }
                  }}
                >
                  <Mail className="size-4" aria-hidden />
                  {emailing ? 'Sending…' : 'Email'}
                </Button>

                {addButton}
              </div>
            </header>

            <div className="p-4 sm:p-5">
              {error ? (
                <p
                  role="alert"
                  className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
                >
                  <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              ) : loading ? (
                <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
                  <span className="sr-only">Loading appointments</span>
                  {[0, 1, 2].map((row) => (
                    <div
                      key={row}
                      className="border-border bg-surface-hover h-[4.5rem] animate-pulse rounded-lg border"
                    />
                  ))}
                </div>
              ) : (
                <AppointmentList
                  appointments={selectedAppointments}
                  emptyMessage="Nothing scheduled on this day."
                  emptyAction={addButton}
                  renderActions={(appointment) => (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${appointment.title}`}
                        className="text-muted-foreground hover:text-foreground size-8"
                        onClick={() => {
                          setEditing(appointment)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${appointment.title}`}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
                        onClick={() => setPendingDelete(appointment)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </>
                  )}
                />
              )}

              {emailResult && (
                <p
                  role="status"
                  className="border-border text-muted-foreground mt-4 flex items-start gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm"
                >
                  <Mail className="mt-px size-4 shrink-0" aria-hidden />
                  {emailResult}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Refetching the month is what makes the new appointment appear in the day's
          list and its day become marked, without a page reload. */}
      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedDate={selected}
        appointment={editing}
        onSaved={() => void loadMonth(month)}
      />

      {/* Permanent, after an explicit confirmation. No undo is offered anywhere
          — clarification Q3. */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="border-destructive/30 bg-destructive/10 text-destructive mb-1 flex size-9 items-center justify-center rounded-lg border">
              <Trash2 className="size-4" aria-hidden />
            </div>
            <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title} will be removed permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!pendingDelete) return
                const id = pendingDelete.id
                setPendingDelete(null)
                try {
                  await api.remove(id)
                  await loadMonth(month)
                } catch (caught) {
                  setError(
                    caught instanceof Error ? caught.message : 'Could not delete the appointment.',
                  )
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
