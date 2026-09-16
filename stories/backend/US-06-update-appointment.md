# US-06 — Update an appointment

**Layer**: Backend · **Priority band**: P4 (edit and delete) · **Cut position**: 4 of 6.

## Story

As a signed-in person, I want to change the details of one of my appointments — including
moving it to another date — so that my calendar stays true when plans change.

## Traces to

- Spec user story: **US-4 — Change or remove an appointment**
- Requirements: **FR-018, FR-016, FR-027, FR-028**
- Success criteria: **SC-004, SC-005, SC-006**

## Behaviour

- Accepts the same fields as creation and replaces the stored values.
- Applies **exactly** the same validation rules as US-05 — the rules live in one place and are
  used by both operations.
- Permits the date to change, which moves the appointment to a different day.
- Refuses to touch an appointment the caller does not own, failing as not-found.
- Leaves the creation moment unchanged.

## Provisional contract

`PUT /api/appointments/{id}` — request `{ title, notes?, date, startTime, endTime }`, response
the updated appointment DTO.

## Acceptance criteria

1. Changing the title, notes, or times of an owned appointment stores the new values and
   returns them.
2. Changing the date moves the appointment: a range query for the old day no longer returns it,
   and a query for the new day does.
3. Every validation rule from US-05 applies identically — missing title, over-length text, end
   time not after start — and a refused update stores nothing.
4. Updating another person's appointment by id returns **404**, and that appointment is
   unchanged.
5. Updating an id that does not exist returns 404.
6. The creation moment is the same before and after.

## Done when

Proven in Swagger: edit a field, move the appointment to another date and confirm both range
queries reflect it, confirm each validation refusal, and confirm person A gets 404 editing
person B's appointment while B's data stays intact.

## Depends on

**US-05** (shares its validation) and **US-04** (used to prove the move).
