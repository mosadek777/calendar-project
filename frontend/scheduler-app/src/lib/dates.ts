/** Date and time helpers. Everything here is local-time only — no timezone handling. */

/** Date -> "yyyy-MM-dd", using local parts so the day never shifts. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** "yyyy-MM-dd" -> Date at local midnight. */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/** "09:30:00" -> "09:30", for display. */
export function toDisplayTime(value: string): string {
  return value.slice(0, 5)
}

/**
 * THE TIME-FORMAT GOTCHA (T-59).
 *
 * `<input type="time">` yields "09:30". A TimeOnly will not bind to that, and the
 * server answers 400 in a way that looks like nothing is wrong with the form. Every
 * time leaving this app goes through here first.
 */
export function toServerTime(inputValue: string): string {
  if (!inputValue) return inputValue
  // "09:30" -> "09:30:00"; anything already carrying seconds is left alone.
  return inputValue.length === 5 ? `${inputValue}:00` : inputValue
}

/** The inverse: "09:30:00" -> "09:30", for putting a value back into a time input. */
export function toInputTime(serverValue: string): string {
  return serverValue.slice(0, 5)
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
