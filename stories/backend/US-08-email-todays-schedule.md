# US-08 — Email me a day's schedule

> **Widened during Phase 7** from "today" to "the selected day", after US-13 was dropped and the
> calendar's day panel became the main view. Today is still what arrives when the button is
> pressed on open, because the calendar opens with today selected. The endpoint is
> `POST /api/appointments/email-day?date=`.

**Layer**: Backend · **Priority band**: P6 (manual email) · **Cut position**: 6 of 6 — **this
is the first thing dropped if the day runs out.**

## Story

As a signed-in person, I want to ask the system to email me today's appointments, so that I
have my day in my inbox without keeping the app open.

## Traces to

- Spec user story: **US-6 — Email myself today's schedule**
- Requirements: **FR-023, FR-023a, FR-024, FR-025, FR-026, FR-027**
- Clarification: **Q5 — plain text, one line per appointment, dated subject**
- Constitution: **Article VIII — Email by button, never by scheduler**
- Success criteria: **SC-007**

## Behaviour

- Triggered only by an explicit request from the signed-in person. There is no timer, hosted
  service, queue, or background job anywhere in the solution.
- Builds today's list for the caller — same data as a single-day range query for the current
  local date.
- Sends **plain text**: a subject line naming today's date, then one line per appointment
  showing start time, end time, and title, with any note beneath it.
- Sends an email saying nothing is scheduled when the day is empty — the person still gets a
  reply.
- Sends to the address the person registered with, taken from their account, never from the
  request.
- Reports success or failure to the caller and changes no appointment data either way.
- Sends through an email-sender abstraction so that swapping the local development mail catcher
  for a real provider is a configuration change, not a code change.

## Provisional contract

`POST /api/appointments/email-day?date=YYYY-MM-DD` — no request body, response `{ sent, message }`.

## Acceptance criteria

1. Pressing the trigger sends exactly one email to the caller's registered address.
2. The body lists today's appointments in ascending start-time order with start time, end time,
   and title; notes appear beneath their appointment.
3. The subject line names today's date.
4. With nothing scheduled today, an email is still sent and states that plainly.
5. A recipient address supplied in the request is ignored; the registered address is used.
6. When the mail service is unreachable, the caller is told the send failed, and no appointment
   is created, changed, or deleted.
7. Leaving the system running without pressing the trigger produces zero emails.

## Done when

Proven with the local mail catcher open: the message arrives with the right subject and body,
the empty-day case arrives too, stopping the mail catcher produces a clean failure message, and
no message ever appears without a request being made.

## Depends on

**US-03** (caller identity) and **US-04**'s data shape. Independent of US-05/06/07 — it can be
demonstrated against seeded data.
