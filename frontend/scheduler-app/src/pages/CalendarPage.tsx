import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="min-h-svh">
      <Nav />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 lg:flex-row lg:items-start">
        <Card className="lg:w-fit">
          <CardContent className="flex justify-center">
            <Calendar
              key={busyKey}
              mode="single"
              selected={selected}
              onSelect={(day) => day && setSelected(day)}
              month={month}
              onMonthChange={setMonth}
              showOutsideDays={false}
              modifiers={{ busy: busyDays }}
              modifiersClassNames={{
                busy: 'relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary',
              }}
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">{formatLongDate(selected)}</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            ) : loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <AppointmentList
                appointments={selectedAppointments}
                emptyMessage="Nothing scheduled on this day."
                renderActions={(appointment) => (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(appointment)
                        setFormOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(appointment)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              />
            )}
          </CardContent>
        </Card>
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
            <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title} will be removed permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
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
