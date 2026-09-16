# API Contracts: Appointment Scheduler

**Base URL**: `https://localhost:<port>/api` (the port Kestrel picks at first run)
**Format**: JSON in, JSON out. `Content-Type: application/json`.

| File | Covers |
|---|---|
| [auth.md](./auth.md) | `POST /auth/register`, `POST /auth/login` — **open** |
| [appointments.md](./appointments.md) | The five appointment operations — **all protected** |

---

## Endpoint summary

| Method | Path | Auth | Story |
|---|---|---|---|
| POST | `/api/auth/register` | Open | US-01 |
| POST | `/api/auth/login` | Open | US-02 |
| GET | `/api/appointments?from=&to=` | Bearer | US-04 |
| POST | `/api/appointments` | Bearer | US-05 |
| PUT | `/api/appointments/{id}` | Bearer | US-06 |
| DELETE | `/api/appointments/{id}` | Bearer | US-07 |
| POST | `/api/appointments/email-today` | Bearer | US-08 |

Six URLs, seven operations. Article IX keeps it there: no `/month`, no `/today`, no `/search`,
no pagination parameters.

---

## Authentication

Protected endpoints require:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The token comes from register or login and is valid for **8 hours** (clarification Q1). After
that, every protected call returns 401 and the frontend returns the person to sign-in.

**The caller's identity is taken only from the token's `sub` claim.** No request body, route
value, or query parameter anywhere in these contracts carries a user id — there is nothing for
a client to spoof (Article VI, FR-027).

---

## Wire formats

| Concept | Format | Example | Note |
|---|---|---|---|
| Date | `YYYY-MM-DD` | `"2026-09-16"` | Serialized from `DateOnly` |
| Time | `HH:mm:ss` | `"09:30:00"` | Serialized from `TimeOnly` — **seconds are required** |
| Timestamp | ISO 8601 UTC | `"2026-09-16T08:12:44.123Z"` | `CreatedAt` only |
| Id | GUID string | `"3f2a...-...-..."` | |

> **The one gotcha that will bite.** The browser's `<input type="time">` produces `"09:30"`,
> which will not bind to a `TimeOnly`. The frontend appends `":00"` before sending. See D4 in
> [plan.md](../plan.md).

---

## Error shape

Validation failures (data annotations) return ASP.NET Core's standard
`ValidationProblemDetails`:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Title": ["The Title field is required."] }
}
```

Service-level refusals return a `ProblemDetails` with a human-readable `detail`:

```json
{ "title": "Invalid times", "status": 400, "detail": "End time must be after start time." }
```

## Status codes used

| Code | Meaning here |
|---|---|
| 200 | Read or update succeeded |
| 201 | Appointment created — body is the created appointment |
| 204 | Delete succeeded, no body |
| 400 | Validation failed, annotation or service rule |
| 401 | Missing, malformed, or expired token |
| 404 | Not found **or not yours** — deliberately the same answer |
| 409 | Email already registered |
| 500 | Unhandled — should not appear; if it does, it is a bug |

**403 is never returned.** Asking for someone else's appointment gets 404, so the response
cannot confirm that it exists (FR-028, US-03 AC-4).
