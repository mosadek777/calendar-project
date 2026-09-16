# US-07 — Delete an appointment

**Layer**: Backend · **Priority band**: P4 (edit and delete) · **Cut position**: 4 of 6.

## Story

As a signed-in person, I want to permanently remove one of my appointments, so that a
cancelled commitment stops occupying my calendar.

## Traces to

- Spec user story: **US-4 — Change or remove an appointment**
- Requirements: **FR-019, FR-020, FR-027, FR-028**
- Clarification: **Q3 — confirm, then permanent; no undo**
- Success criteria: **SC-004, SC-005**

## Behaviour

- Removes the row outright. There is no soft delete, archive, trash, or restore — Article IX
  bans soft delete and the clarification ruled out undo.
- Refuses to touch an appointment the caller does not own, failing as not-found.
- Returns no content on success.
- The confirmation step is the frontend's responsibility (US-13); the backend deletes when
  asked.

## Provisional contract

`DELETE /api/appointments/{id}` — response 204 No Content.

## Acceptance criteria

1. Deleting an owned appointment removes it; a subsequent range query does not return it.
2. The response carries no body.
3. Deleting the same id a second time returns 404.
4. Deleting an id that never existed returns 404.
5. Deleting another person's appointment returns **404** and that appointment still exists.
6. No column anywhere is used to mark the row as deleted — the row is gone from the table.

## Done when

Proven in Swagger: delete removes the appointment from range queries, the repeat delete gives
404, person A gets 404 deleting person B's appointment, and the row is confirmed absent from
the table rather than flagged.

## Depends on

**US-03**. Verified against **US-04**.
