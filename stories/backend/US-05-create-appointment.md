# US-05 — Create an appointment

**Layer**: Backend · **Priority band**: P3 (create) · **Cut position**: 3 of 6.

## Story

As a signed-in person, I want to save a new appointment, so that my commitments are recorded
against a day.

## Traces to

- Spec user story: **US-3 — Add an appointment to a day**
- Requirements: **FR-013, FR-014, FR-015, FR-015a, FR-016, FR-027**
- Clarification: **Q2 — free time entry to the minute, same calendar day**
- Success criteria: **SC-003, SC-006**

## Behaviour

- Accepts title, optional notes, date, start time, end time.
- Assigns ownership from the token. An owner id in the request body is ignored.
- Validates on the server, independently of any form:
  - title present, 1–200 characters
  - notes optional, at most 1000 characters
  - date present
  - start and end times present, accepted to any minute
  - end time strictly later than start time, both on the same calendar day
- Stores the creation moment.
- Returns the created appointment, including its new id, so the caller can render it without a
  second fetch.

## Provisional contract

`POST /api/appointments` — request `{ title, notes?, date, startTime, endTime }`, response the
created appointment DTO, status 201.

## Acceptance criteria

1. A valid request stores the appointment against the caller and returns it with an id.
2. A missing or empty title is refused, naming title as required; nothing is stored.
3. A title over 200 characters, or notes over 1000, is refused naming the limit.
4. An end time equal to or earlier than the start time is refused with a message saying the end
   must be after the start.
5. A time such as 09:07 is accepted — there is no slot restriction.
6. Omitting notes succeeds and stores no note.
7. An `ownerId`/`userId` planted in the request body is ignored; the appointment belongs to the
   token holder.
8. Every one of these rules holds for a request sent directly to the endpoint with no form
   involved.

## Done when

Proven in Swagger: create succeeds and returns an id; each invalid case above is refused with a
useful message; a planted owner id has no effect.

## Depends on

**US-03**. Verified against **US-04** (the created appointment appears in a range query).
