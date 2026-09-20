# Manual Test Checklist: Appointment Scheduler

**Feature**: [../spec.md](../spec.md) · **Stories**: [../../../stories/README.md](../../../stories/README.md)
**Written**: 2026-09-20 (T-79) · **Walked**: _(T-80 — record the date here)_

There is no automated test project (Article IX). This checklist is the verification, and it is
walked by hand.

**Not included — US-13 was dropped.** The agenda screen was never built, so FR-021 and FR-022
have nothing to test. That is a recorded cut, not a gap: see `plan.md` and `tasks.md` Phase 9.

---

## Before you start

- [ ] MailDev running — `Test-NetConnection -ComputerName localhost -Port 1025` returns `True`, UI at <http://localhost:1080>
- [ ] LocalDB running — `sqllocaldb info MSSQLLocalDB`
- [ ] API running — `dotnet run` in `backend\Scheduler.Api`, Swagger reachable
- [ ] Frontend running — `npm run dev` in `frontend\scheduler-app`, <http://localhost:5173>
- [ ] `public\auth-bg.jpg` present, or accept the gradient fallback on the auth screens
- [ ] **A clean browser profile**, or at least cleared `localStorage` — a stale token invalidates the first three checks
- [ ] Two accounts registered, **A** and **B**, with appointments on A across two different months

---

## US-01 — Register an account · Swagger

- [ ] A never-registered email with an 8+ character password returns **201** and a token
- [ ] The same email a second time returns **409** naming the email as in use
- [ ] A malformed email returns **400**; no account is created
- [ ] A 7-character password returns **400**; no account is created
- [ ] `SELECT Email, PasswordHash FROM Users` shows a hash, never the submitted password
- [ ] The rules hold for a request sent straight to the endpoint, with no form involved

## US-02 — Sign in · Swagger

- [ ] Correct credentials return **200** and a token
- [ ] The token decoded at jwt.io carries `sub` = the user's GUID, and `exp` **8 hours** out
- [ ] A wrong password returns **401**
- [ ] An unregistered email returns a **byte-identical** 401 body and status
- [ ] No response from either auth endpoint contains the password or the hash

## US-03 — Protection and ownership · Swagger, two accounts

- [ ] Any appointment endpoint **without** a token returns **401**
- [ ] A malformed or tampered token returns **401**
- [ ] As B, `GET` the range never returns any of A's appointments
- [ ] As B, `PUT` on A's appointment id returns **404** — not 403
- [ ] As B, `DELETE` on A's appointment id returns **404** — not 403
- [ ] A's appointment is unchanged after both attempts
- [ ] A `userId` planted in a request body changes nothing
- [ ] Register and login remain reachable with no token

## US-04 — Read appointments in a range · Swagger

- [ ] A month-wide range returns that month's appointments and nothing else
- [ ] `from` = `to` returns exactly that day's appointments
- [ ] Results are ordered by date, then ascending start time
- [ ] A range with nothing in it returns `[]` with **200**, not 404
- [ ] `to` earlier than `from` returns **400**
- [ ] No response contains `userId` or any other entity internal

## US-05 — Create · Swagger

- [ ] A valid request returns **201** with a new id
- [ ] Empty title → **400** naming title as required
- [ ] Title over 200 characters → **400**
- [ ] Notes over 1000 characters → **400**
- [ ] End time equal to start → **400**, "End time must be after start time."
- [ ] End time earlier than start → **400**
- [ ] `09:07:00` is accepted — there is no slot restriction
- [ ] Notes omitted saves successfully with no note
- [ ] A planted `userId` in the body is ignored; the appointment belongs to the token holder

## US-06 — Update · Swagger

- [ ] Changing title, notes or times stores and returns the new values
- [ ] Changing the date moves it: the old day's range no longer returns it, the new day's does
- [ ] The same validation refusals as create, with the same messages
- [ ] `createdAt` is identical before and after
- [ ] A non-existent id returns **404**

## US-07 — Delete · Swagger

- [ ] Delete returns **204** with no body
- [ ] The appointment no longer appears in any range
- [ ] A second delete of the same id returns **404**
- [ ] `SELECT COUNT(*) FROM Appointments` confirms the row is **gone**, not flagged
- [ ] No column anywhere marks the row as deleted

## US-08 — Email a day's schedule · Swagger + MailDev

- [ ] `POST /api/appointments/email-day?date=` for today sends exactly one message
- [ ] Subject names that date
- [ ] Body lists that day's appointments in ascending start-time order, notes indented beneath
- [ ] A **different** day sends that day's schedule, with that date in the subject
- [ ] An empty day still sends, saying nothing is scheduled
- [ ] A recipient supplied in the request is ignored; the registered address is used
- [ ] With `maildev` stopped, the response is **200** with `sent: false`, not a 500
- [ ] After a failed send, no appointment is created, changed or deleted

---

## US-09 — Auth screens and the route guard · Browser

- [ ] Registering a fresh email signs you in and lands on `/calendar`
- [ ] Registering an email already in use shows the **server's** 409 message inline on the form
- [ ] Signing in with correct credentials lands on `/calendar`
- [ ] A wrong password shows the generic refusal inline
- [ ] Reloading while signed in keeps you signed in
- [ ] Typing `/calendar` while signed out lands on `/login`
- [ ] Signing out returns to `/login` and closes the protected screens again
- [ ] **`/` forwards to `/calendar`** when signed in — no dead end (T-78a)
- [ ] **`/` sends a signed-out visitor to `/login`**, not through the calendar first
- [ ] An unknown path such as `/nonsense` lands on the calendar, not a blank screen

## US-10 — Month calendar and day panel · Browser

- [ ] Exactly the days holding appointments carry a dot; no others do
- [ ] Clicking a marked day lists its appointments in ascending start-time order
- [ ] Each row shows title and both times
- [ ] Clicking an empty day shows "Nothing scheduled on this day."
- [ ] Previous / next month refetches and the dots match that month
- [ ] The screen opens with **today** selected
- [ ] Signed in as B, no dots appear at all
- [ ] The grid is shadcn's `Calendar` — no hand-built month grid, no events-calendar library

## US-11 — Create from the selected day · Browser

- [ ] The form opens with the date pre-filled to the selected day
- [ ] Saving closes the dialog and the appointment appears in the day's list
- [ ] **The day gains its dot immediately**, with no reload
- [ ] Empty title shows "Title is required." and saves nothing
- [ ] End time equal to or before start shows the end-after-start message and saves nothing
- [ ] **`09:07` saves successfully** — the seconds fix works
- [ ] Empty notes saves successfully
- [ ] A server-side refusal is surfaced on the form
- [ ] **Double-clicking Add appointment creates exactly one appointment**

## US-12 — Edit and delete · Browser

- [ ] Edit opens pre-filled with the current title, notes, date, start and end
- [ ] Saving changes updates the day's list in place
- [ ] Changing the date moves the appointment and **both** days' dots update
- [ ] The same validation messages as create
- [ ] Delete asks for confirmation before anything happens
- [ ] Cancelling leaves the appointment untouched
- [ ] Confirming removes it immediately
- [ ] A day losing its last appointment **loses its dot**
- [ ] No undo is offered anywhere

## US-14 — Email button · Browser

- [ ] Pressing it sends one message, visible in MailDev
- [ ] **Double-clicking sends exactly one message, not two**
- [ ] While in flight the button is disabled and reads "Sending…"
- [ ] Success shows the server's message naming the address
- [ ] With `maildev` stopped, the failure message appears and the list is unchanged
- [ ] Leaving the page open, untouched, sends **zero** messages

---

## Design and accessibility · Browser

- [ ] Dark theme by default, no flash of white on load
- [ ] Auth screens: photo fills the viewport, form panel reads as glass above it
- [ ] Busy-day dots are clearly visible against the filled cell
- [ ] Every interactive element shows a visible **focus ring** when tabbed to
- [ ] Row Edit/Delete icons are reachable by keyboard and visible on touch
- [ ] Empty, loading and error states each render their designed treatment, not bare text
- [ ] **375px**: no horizontal scroll on any screen
- [ ] **375px**: the dialog fits, start/end stack, buttons stay ≥44px
- [ ] With OS "reduce motion" on, transitions do not animate

## Cross-cutting

- [ ] `git status` never lists `appsettings.Development.json`
- [ ] No email is ever sent except by pressing the button
- [ ] Nothing in the UI reveals another user's data in any view

---

## Result

**Walked by**: _______________ **Date**: _______________

**Passed**: ____ / ____ **Failed**: ____

Record any failure with the story id, the step, and what happened instead:

| Story | Step | Expected | Actual |
|---|---|---|---|
| | | | |
