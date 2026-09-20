import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarOff } from 'lucide-react'
import type { AppointmentResponse } from '@/lib/types'
import { toDisplayTime } from '@/lib/dates'
import { listItem } from '@/lib/motion'

interface AppointmentListProps {
  appointments: AppointmentResponse[]
  emptyMessage: string
  /** Supplied from T-64 onward; absent means the list is read-only. */
  renderActions?: (appointment: AppointmentResponse) => ReactNode
  /** Rendered under the empty message — the action that fills the day. */
  emptyAction?: ReactNode
}

export function AppointmentList({
  appointments,
  emptyMessage,
  renderActions,
  emptyAction,
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="border-border/70 flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
        <CalendarOff className="text-muted-foreground/60 size-6" aria-hidden />
        <div>
          <p className="text-sm font-medium">{emptyMessage}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Nothing here yet — add something to this day.
          </p>
        </div>
        {emptyAction}
      </div>
    )
  }

  // The server already orders by date then start time; this keeps the list correct
  // even when it is assembled from more than one response.
  const ordered = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {ordered.map((appointment, index) => (
          <motion.li
            key={appointment.id}
            layout
            {...listItem(index)}
            className="group border-border bg-background/40 hover:border-border-strong hover:bg-surface-hover relative flex items-start justify-between gap-3 overflow-hidden rounded-lg border p-3.5 pl-4 transition-colors"
          >
            {/* Thin accent rule: colour without shouting. */}
            <span
              className="bg-accent/70 absolute inset-y-3 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />

            <div className="min-w-0">
              <p className="text-muted-foreground tnum text-xs tracking-wide">
                {toDisplayTime(appointment.startTime)} – {toDisplayTime(appointment.endTime)}
              </p>
              <p className="mt-1 text-[0.9375rem] leading-snug font-medium break-words">
                {appointment.title}
              </p>
              {appointment.notes && (
                <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[0.8125rem] leading-relaxed break-words">
                  {appointment.notes}
                </p>
              )}
            </div>

            {renderActions && (
              <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                {renderActions(appointment)}
              </div>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
