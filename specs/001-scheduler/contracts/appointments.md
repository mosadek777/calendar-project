# Contract: Appointments

**Controller**: `Controllers\AppointmentsController.cs` · **Service**: `IAppointmentService`
**Every endpoint carries `[Authorize]`.** Without a valid token the request is answered 401 by
middleware and the controller never runs.

**Identity**: the controller reads `User.FindFirstValue("sub")` and passes
that `Guid userId` as the first argument of every service call. No DTO on this page has a user
id property (FR-027, D2 in [plan.md](../plan.md)).

---

## Shared shape — `AppointmentResponse`

```json
{
  "id": "8c2f1e40-...",
  "title": "Dentist",
  "notes": "Bring the referral letter",
  "date": "2026-09-16",
  "startTime": "09:30:00",
  "endTime": "10:15:00",
  "createdAt": "2026-09-15T18:04:11.482Z"
}
```

`notes` is `null` when absent. **`userId` is not present** — it is neither useful to the client
nor safe to normalize returning.

## Shared shape — `AppointmentRequest` (create and update both)

```json
{
  "title": "Dentist",
  "notes": "Bring the referral letter",
  "date": "2026-09-16",
  "startTime": "09:30:00",
  "endTime": "10:15:00"
}
```

| Field | Type | Annotations | Rule |
|---|---|---|---|
| `title` | string | `[Required]`, `[MaxLength(200)]` | FR-014 |
| `notes` | string? | `[MaxLength(1000)]` | Optional |
| `date` | `DateOnly` | `[Required]` | `YYYY-MM-DD` |
| `startTime` | `TimeOnly` | `[Required]` | `HH:mm:ss`, any minute |
| `endTime` | `TimeOnly` | `[Required]` | `HH:mm:ss`, **strictly after** `startTime` |

The end-after-start rule cannot be expressed as an annotation, so it lives in one service method
used by **both** create and update — the two can never disagree (FR-015, FR-016).

---

## `GET /api/appointments?from={date}&to={date}` — US-04

One endpoint serving three screens: the month's marks, the selected day's list, and today's
agenda (D1).

| Parameter | Type | Required | Note |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | yes | Inclusive |
| `to` | `YYYY-MM-DD` | yes | Inclusive. `from == to` gives one day |

**200 OK** — an array of `AppointmentResponse`, ordered by `date`, then `startTime`. An empty
range returns `[]`, not 404.

| Code | When |
|---|---|
| 200 | Always, including when the result is empty |
| 400 | Missing/unparseable parameter, or `to` earlier than `from` |
| 401 | No or expired token |

**Query**: `Where(a => a.UserId == userId && a.Date >= from && a.Date <= to)`. The `userId`
filter is not optional and not conditional — it is how another person's appointments become
unreachable (FR-028).

No paging parameters. Article IX puts pagination out of scope.

---

## `POST /api/appointments` — US-05

**Request**: `AppointmentRequest`. **201 Created** → `AppointmentResponse` with its new `id`,
so the frontend can render it without a second fetch.

| Code | When |
|---|---|
| 201 | Created |
| 400 | Annotation failure, or end time not after start time |
| 401 | No or expired token |

`UserId` is assigned from the token and `CreatedAt` from `DateTime.UtcNow`. A `userId` or
`ownerId` in the JSON body binds to nothing and is discarded by the serializer.

---

## `PUT /api/appointments/{id}` — US-06

Full replacement of the mutable fields. **Request**: `AppointmentRequest`. **200 OK** →
the updated `AppointmentResponse`.

| Code | When |
|---|---|
| 200 | Updated |
| 400 | Same validation rules as create |
| 401 | No or expired token |
| **404** | No such appointment **or it belongs to someone else** |

Changing `date` moves the appointment to another day — that is the whole mechanism behind
US-12's "move to another date". `CreatedAt` is not touched.

Fetch is `FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId)`; `null` → 404.

---

## `DELETE /api/appointments/{id}` — US-07

**204 No Content** on success, with no body.

| Code | When |
|---|---|
| 204 | Deleted |
| 401 | No or expired token |
| **404** | No such appointment, already deleted, **or it belongs to someone else** |

A real `Remove` + `SaveChangesAsync`. No soft-delete column exists to set (Article IX), and no
undo is offered (clarification Q3). The confirmation step is the frontend's job (US-12); this
endpoint deletes when asked.

---

## `POST /api/appointments/email-today` — US-08

No request body. Sends today's schedule to the address on the caller's account.

**200 OK** — `EmailResultResponse`

```json
{ "sent": true, "message": "Today's schedule was sent to someone@example.com." }
```

| Code | When |
|---|---|
| 200 | `sent: true` — accepted by the SMTP server |
| 200 | `sent: false` with a message — SMTP unreachable. Deliberately **not** a 500: the request was valid and nothing broke |
| 401 | No or expired token |

**Behaviour**

1. Today is `DateOnly.FromDateTime(DateTime.Now)` — local, per the spec's timezone stance.
2. Load that day's appointments for `userId`, ordered by `startTime`.
3. Build **plain text** (clarification Q5):
   - Subject: `Your schedule for Wednesday, 16 September 2026`
   - Body: one line per appointment — `09:30–10:15  Dentist` — with any note indented beneath.
   - Empty day: a single line saying nothing is scheduled. An email still goes out (FR-025).
4. Hand subject and body to `IEmailSender.SendAsync(to, subject, body)`. The recipient comes
   from the account, never from the request (US-08 AC-5).
5. No appointment is created, changed, or deleted, whether the send succeeds or fails
   (FR-026).

**This endpoint is the only thing in the solution that sends email, and it only ever runs
because a person pressed a button.** There is no `IHostedService`, no `BackgroundService`, no
timer, no queue anywhere in the project (Article VIII, FR-024).
