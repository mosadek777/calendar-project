import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppointmentList } from '@/components/AppointmentList'
import { Nav } from '@/components/Nav'
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

  /** The days react-day-picker should mark. */
  const busyDays = useMemo(
    () => [...new Set(appointments.map((a) => a.date))].map(fromIsoDate),
    [appointments],
  )

  const selectedIso = toIsoDate(selected)
  const selectedAppointments = appointments.filter((a) => a.date === selectedIso)

  return (
    <div className="min-h-svh">
      <Nav />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 lg:flex-row lg:items-start">
        <Card className="lg:w-fit">
          <CardContent className="flex justify-center">
            <Calendar
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
          <CardHeader>
            <CardTitle className="text-base">{formatLongDate(selected)}</CardTitle>
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
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
