// Mirrors specs/001-scheduler/contracts/. Keep in step with them.

export interface AuthResponse {
  token: string
  email: string
}

export interface AppointmentResponse {
  id: string
  title: string
  notes: string | null
  /** yyyy-MM-dd */
  date: string
  /** HH:mm:ss — seconds are required by the server */
  startTime: string
  /** HH:mm:ss — seconds are required by the server */
  endTime: string
  createdAt: string
}

export interface AppointmentRequest {
  title: string
  notes?: string | null
  /** yyyy-MM-dd */
  date: string
  /** HH:mm:ss */
  startTime: string
  /** HH:mm:ss */
  endTime: string
}
