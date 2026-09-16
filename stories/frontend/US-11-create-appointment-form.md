# US-11 — Create an appointment from the selected day

**Layer**: Frontend · **Priority band**: P3 (create) · **Cut position**: 3 of 6.

## Story

As a signed-in person, I want to add an appointment to the day I have selected, so that my own
commitments go into the calendar.

## Traces to

- Spec user story: **US-3 — Add an appointment to a day**
- Requirements: **FR-013, FR-014, FR-015, FR-015a, FR-017**
- Clarification: **Q2 — free time fields, any minute**
- Backend stories consumed: **US-05**, then **US-04** to refresh
- Success criteria: **SC-003**

## Behaviour

- An "add" control on the calendar screen opens a shadcn dialog holding the form.
- Fields: title (required), notes (optional), date, start time, end time. Times are plain time
  fields accepting any minute — no slot dropdown.
- The date is pre-filled with the currently selected day.
- Client-side checks give fast feedback, but the server's refusal is what is displayed when the
  two disagree — the server is the authority.
- On success the dialog closes, the day's list shows the new appointment in its time position,
  and the day becomes marked — **without a page reload**.

## Acceptance criteria

1. Opening the form on a selected day pre-fills that date.
2. Submitting a valid appointment closes the dialog and shows it in the day's list at the right
   time position, with no reload.
3. A day that was unmarked becomes marked immediately after its first appointment is saved.
4. Submitting with an empty title shows a "title is required" message and saves nothing.
5. Submitting an end time equal to or earlier than the start shows the end-after-start message
   and saves nothing.
6. A time like 09:07 is accepted.
7. Leaving notes empty saves successfully.
8. A server-side refusal is surfaced on the form rather than silently swallowed.

## Done when

Demonstrated in the browser: add to an empty day, watch it appear and the day become marked;
then walk each refusal case and confirm the message appears and nothing is stored.

## Depends on

Frontend **US-10** (selected day and the list it refreshes); backend **US-05**.
