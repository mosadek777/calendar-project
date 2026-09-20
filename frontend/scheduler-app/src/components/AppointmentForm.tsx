import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { toInputTime, toIsoDate, toServerTime } from '@/lib/dates'
import type { AppointmentResponse } from '@/lib/types'

interface AppointmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fills the date when creating. */
  selectedDate: Date
  /** Absent means create; present means edit. One form, two modes. */
  appointment?: AppointmentResponse | null
  onSaved: () => void
}

export function AppointmentForm({
  open,
  onOpenChange,
  selectedDate,
  appointment,
  onSaved,
}: AppointmentFormProps) {
  const isEdit = Boolean(appointment)

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /**
   * Same re-entry guard as the email button: `disabled={busy}` is applied only on
   * the next render, so a fast double-submit would otherwise save twice.
   */
  const savingRef = useRef(false)

  // Refill whenever the dialog opens, so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!open) return

    setError(null)

    if (appointment) {
      setTitle(appointment.title)
      setNotes(appointment.notes ?? '')
      setDate(appointment.date)
      setStartTime(toInputTime(appointment.startTime))
      setEndTime(toInputTime(appointment.endTime))
    } else {
      setTitle('')
      setNotes('')
      setDate(toIsoDate(selectedDate))
      setStartTime('09:00')
      setEndTime('10:00')
    }
  }, [open, appointment, selectedDate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // Synchronous, before any await.
    if (savingRef.current) return

    setError(null)

    // Fast feedback only. The server enforces these rules again and its answer wins.
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (toServerTime(endTime) <= toServerTime(startTime)) {
      setError('End time must be after start time.')
      return
    }

    const body = {
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : null,
      date,
      startTime: toServerTime(startTime),
      endTime: toServerTime(endTime),
    }

    savingRef.current = true
    setBusy(true)
    try {
      if (appointment) {
        await api.update(appointment.id, body)
      } else {
        await api.create(body)
      }
      onOpenChange(false)
      onSaved()
    } catch (caught) {
      // Whatever the server said, verbatim.
      setError(caught instanceof Error ? caught.message : 'Could not save the appointment.')
    } finally {
      savingRef.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit appointment' : 'New appointment'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Change any detail, including the date.'
              : 'Times can be any minute — there are no fixed slots.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={1000}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
