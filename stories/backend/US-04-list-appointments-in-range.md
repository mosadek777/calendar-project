# US-04 — Retrieve my appointments in a date range

**Layer**: Backend · **Priority band**: P2 (month calendar and day view) · **Cut position**: 2
of 6.

## Story

As a signed-in person, I want to fetch my appointments between two dates, so that one call can
feed the month's marked days, the selected day's list, and today's agenda.

## Traces to

- Spec user stories: **US-2 — See the month and pick a day**, **US-5 — Land on today's agenda**
- Requirements: **FR-009, FR-010, FR-012, FR-021, FR-028**
- Success criteria: **SC-002**

## Behaviour

- Returns the signed-in person's appointments whose date falls within an inclusive from/to
  range, ordered by date then start time.
- One endpoint serves three screens: a whole month for the calendar marks, a single day for the
  day panel, and today for the agenda. **This is a deliberate simplification** — three
  purpose-built endpoints would be tidier and would cost time we do not have.
- Returns an empty list, not an error, when the range holds nothing.
- Never returns another person's appointments, whatever the range.
- Refuses a range where `to` is earlier than `from`.

## Provisional contract

`GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD` — response is a list of appointment DTOs
carrying id, title, notes, date, start time, end time.

## Acceptance criteria

1. A month-wide range returns every appointment of that month for the caller and nothing else.
2. A single-day range (`from` = `to`) returns exactly that day's appointments.
3. Results are ordered by date, then ascending start time.
4. A range containing nothing returns an empty list with a success status.
5. With person A's token, no appointment of person B appears in any range.
6. `to` earlier than `from` is refused with a validation message.
7. The response contains no entity internals — no owner id, no password field, nothing beyond
   the listed fields.

## Done when

Proven in Swagger: seed appointments across two months for two accounts, then confirm month
range, single-day range, empty range, ordering, and cross-account isolation.

## Depends on

**US-03** (protection and caller identity).
