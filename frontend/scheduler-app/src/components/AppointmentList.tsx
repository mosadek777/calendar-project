import type { ReactNode } from 'react'
import type { AppointmentResponse } from '@/lib/types'
import { toDisplayTime } from '@/lib/dates'

interface AppointmentListProps {
  appointments: AppointmentResponse[]
  emptyMessage: string
  /** Supplied from T-64 onward; absent means the list is read-only. */
  renderActions?: (appointment: AppointmentResponse) => ReactNode
}

export function AppointmentList({ appointments, emptyMessage, renderActions }: AppointmentListProps) {
  if (appointments.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>
  }

  // The server already orders by date then start time; this keeps the list correct
  // even when it is assembled from more than one response.
  const ordered = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <ul className="flex flex-col gap-2">
      {ordered.map((appointment) => (
        <li
          key={appointment.id}
          className="flex items-start justify-between gap-3 rounded-md border p-3"
        >
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm tabular-nums">
              {toDisplayTime(appointment.startTime)}–{toDisplayTime(appointment.endTime)}
            </p>
            <p className="font-medium break-words">{appointment.title}</p>
            {appointment.notes && (
              <p className="text-muted-foreground mt-1 text-sm break-words">{appointment.notes}</p>
            )}
          </div>

          {renderActions && <div className="flex shrink-0 gap-1">{renderActions(appointment)}</div>}
        </li>
      ))}
    </ul>
  )
}
