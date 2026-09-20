# Stories — Appointment Scheduler

**Feature**: [specs/001-scheduler/spec.md](../specs/001-scheduler/spec.md)
**Clarifications**: [specs/001-scheduler/clarifications.md](../specs/001-scheduler/clarifications.md)
**Created**: 2026-09-16

14 stories: **US-01..US-08 backend**, **US-09..US-14 frontend**. Tasks in Phase 6 are numbered
`T-xx [US-yy] description` and every task must name the story it serves.

---

## Index

### Backend — `stories\backend\`

| ID | Story | Band | Cut position |
|----|-------|------|--------------|
| [US-01](backend/US-01-register-account.md) | Register an account | P1 | 1 — never cut |
| [US-02](backend/US-02-sign-in.md) | Sign in and receive a session token | P1 | 1 — never cut |
| [US-03](backend/US-03-protect-endpoints.md) | Protect endpoints and identify the caller | P1 | 1 — never cut |
| [US-04](backend/US-04-list-appointments-in-range.md) | Retrieve my appointments in a date range | P2 | 2 |
| [US-05](backend/US-05-create-appointment.md) | Create an appointment | P3 | 3 |
| [US-06](backend/US-06-update-appointment.md) | Update an appointment | P4 | 4 |
| [US-07](backend/US-07-delete-appointment.md) | Delete an appointment | P4 | 4 |
| [US-08](backend/US-08-email-todays-schedule.md) | Email me today's schedule | P6 | **6 — dropped first** |

### Frontend — `stories\frontend\`

| ID | Story | Band | Cut position |
|----|-------|------|--------------|
| [US-09](frontend/US-09-auth-screens-and-guard.md) | Sign-up, sign-in, and the route guard | P1 | 1 — never cut |
| [US-10](frontend/US-10-month-calendar-and-day-panel.md) | Month calendar with marked days and a day panel | P2 | 2 |
| [US-11](frontend/US-11-create-appointment-form.md) | Create an appointment from the selected day | P3 | 3 |
| [US-12](frontend/US-12-edit-and-delete-appointment.md) | Edit and delete an appointment | P4 | 4 |
| [US-13](frontend/US-13-todays-agenda-screen.md) | Today's agenda as the landing screen | P5 | ❌ **DROPPED — not built** (redundant with the calendar's day panel; see plan.md) |
| [US-14](frontend/US-14-email-schedule-button.md) | The "email me today's schedule" button | P6 | **6 — dropped first** |

---

## The cut line

Work proceeds down this list. **If the day runs out, everything below the line you have reached
is dropped**, and what exists still works.

| Order | Band | Stories | What you have if you stop here |
|-------|------|---------|-------------------------------|
| 1 | P1 accounts | US-01, US-02, US-03, US-09 | People can register, sign in, and be kept out of each other's data. Nothing to look at yet. |
| 2 | P2 calendar | US-04, US-10 | A working month calendar with marked days and a day panel. **First genuinely demoable state.** |
| 3 | P3 create | US-05, US-11 | A usable scheduler — people can put their own appointments in. |
| 4 | P4 edit/delete | US-06, US-07, US-12 | A complete scheduler. **This is the sensible stopping point if time is tight.** |
| 5 | P5 agenda | US-13 | A landing screen showing today. Convenience over data already reachable. |
| 6 | P6 email | US-08, US-14 | The email button. |

**Dropping rules, decided now so they are not argued about at 6pm:**

- **Drop US-08 + US-14 together.** A button with no endpoint, or an endpoint with no button, is
  worse than neither. Nothing else depends on either.
- **Drop US-13 alone.** Sign-in then lands on the calendar screen, which already opens with
  today selected. No other story is touched — this is what clarification Q4 bought.
- **Never drop anything in band 1.** Every story depends on it.
- Bands 3 and 4 are the last place to cut before the product stops being a scheduler.

---

## Dependency graph

```
US-01 register
   └─ US-02 sign in
         └─ US-03 protect + identify          ← everything below needs this
               ├─ US-04 range query
               │     ├─ US-10 calendar + day panel  (needs US-09)
               │     └─ US-13 agenda screen         (needs US-09)
               ├─ US-05 create ──── US-11 create form (needs US-10)
               ├─ US-06 update ──┐
               ├─ US-07 delete ──┴─ US-12 edit + delete (needs US-11)
               └─ US-08 email ───── US-14 email button  (needs US-09)

US-02 ──── US-09 auth screens + guard   ← every frontend story needs this
```

Backend is proven in Swagger before any frontend story starts, per the constitution's Phase 7
order.

---

## Traceability matrix — requirement → story

Every functional requirement in `spec.md` maps to at least one story, and every story traces
back to at least one requirement.

| Requirement | Summary | Backend | Frontend |
|---|---|---|---|
| FR-001 | Create account with email + password | US-01 | US-09 |
| FR-002 | Reject duplicate email | US-01 | US-09 |
| FR-003 | Reject bad email / password under 8 chars | US-01 | US-09 |
| FR-004 | Passwords stored irreversibly, never readable | US-01 | — |
| FR-005 | Sign in; generic refusal on failure | US-02 | US-09 |
| FR-006 | 8-hour session, no silent renewal, sign out | US-02 | US-09 |
| FR-007 | Protected screens closed to signed-out people | US-03 | US-09 |
| FR-008 | Month calendar on its own screen, reachable | — | US-10 |
| FR-009 | Days with appointments visibly marked | US-04 | US-10 |
| FR-010 | Day's appointments listed in time order | US-04 | US-10 |
| FR-011 | "Nothing scheduled" on an empty day | — | US-10 |
| FR-012 | Marks update when the month changes | US-04 | US-10 |
| FR-013 | Create with title, notes, date, start, end; date defaults | US-05 | US-11 |
| FR-014 | Title 1–200, notes ≤ 1000 | US-05 | US-11 |
| FR-015 | End strictly after start, same day | US-05 | US-11 |
| FR-015a | Any minute accepted, no preset slots | US-05 | US-11 |
| FR-016 | Validation enforced server-side regardless of the form | US-05, US-06 | — |
| FR-017 | New appointment appears and marks its day, no reload | — | US-11 |
| FR-018 | Edit any detail including the date | US-06 | US-12 |
| FR-019 | Permanent delete after confirmation, no undo | US-07 | US-12 |
| FR-020 | Marks and lists update after edit or delete | — | US-12 |
| FR-021 | Today's appointments on the landing screen | US-04 | US-13 |
| FR-022 | Plain "nothing scheduled today" message | — | US-13 |
| FR-023 | Button sends today's schedule to registered address | US-08 | US-14 |
| FR-023a | Plain text, one line per appointment, dated subject | US-08 | — |
| FR-024 | Sent only on press; never scheduled | US-08 | US-14 |
| FR-025 | Empty day still sends an email saying so | US-08 | — |
| FR-026 | On-screen success or failure; data unchanged | US-08 | US-14 |
| FR-027 | Acting person taken from the session, never the client | US-03, US-05, US-06, US-08 | — |
| FR-028 | One person's appointments unreachable by another | US-03, US-04, US-06, US-07 | — |

**Coverage: 30 of 30 requirements mapped. No orphan requirements, no orphan stories.**

## Traceability matrix — success criterion → story

| Criterion | Summary | Stories |
|---|---|---|
| SC-001 | Sign-up to agenda in under 60 seconds | US-01, US-02, US-09, US-13 |
| SC-002 | Month's busy days readable without clicking | US-04, US-10 |
| SC-003 | Add an appointment in under 30s, appears immediately | US-05, US-11 |
| SC-004 | Correct or remove an appointment in under 30s | US-06, US-07, US-12 |
| SC-005 | 100% of cross-person access attempts fail | US-03, US-04, US-06, US-07 |
| SC-006 | 100% of invalid submissions refused, form bypassed or not | US-05, US-06 |
| SC-007 | Email on press; zero emails otherwise | US-08, US-14 |
| SC-008 | Every action returns a visible result within 2 seconds | all |

---

## Constitution checks carried by these stories

| Article | Carried by |
|---|---|
| IV — thin controllers, logic in DI services, no banned patterns | every backend story |
| V — DTOs only across the controller boundary | US-04 AC-7, US-01 AC-5 |
| VI — hashing, `[Authorize]`, identity from claims, 404 not 403 | US-01, US-02, US-03 |
| VII — shadcn `Calendar` with a modifier, no hand-built grid, Context for auth | US-09, US-10 |
| VIII — `IEmailSender`, button only, config-only provider swap | US-08, US-14 |
| IX — no soft delete, no pagination, no background jobs | US-07 AC-6, US-04, US-08 |
