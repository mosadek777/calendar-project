# US-10 — Month calendar with marked days and a day panel

**Layer**: Frontend · **Priority band**: P2 (month calendar and day view) · **Cut position**: 2
of 6.

## Story

As a signed-in person, I want a month calendar where days holding appointments are marked, and
a panel showing the selected day's appointments, so that I can read my month at a glance and
drill into any day.

## Traces to

- Spec user story: **US-2 — See the month and pick a day**
- Requirements: **FR-008, FR-009, FR-010, FR-011, FR-012, FR-028**
- Clarification: **Q4 — calendar is its own screen, reached by navigation**
- Backend stories consumed: **US-04**
- Constitution: **Article VII** — shadcn/ui `Calendar` (react-day-picker) with a modifier for
  marked days. Hand-building a month grid or adding an events-calendar library is banned.
- Success criteria: **SC-002**

## Behaviour

- A calendar screen, separate from the agenda screen, reached by a navigation control, with a
  way back.
- The shadcn/ui `Calendar` component renders the month. Days with at least one appointment
  carry a **modifier** that styles them visibly.
- Fetching is one range call per displayed month (backend US-04). Changing month refetches and
  re-marks.
- Selecting a day shows that day's appointments beside or below the calendar, in ascending
  start-time order, each showing title, start time, and end time.
- A day with nothing on it shows a plain "nothing scheduled" message, not an empty box.
- Today is selected by default when the screen opens.

## Acceptance criteria

1. Exactly the days holding appointments in the displayed month are marked; no others are.
2. Clicking a marked day lists its appointments in ascending start-time order with title and
   both times.
3. Clicking an empty day shows the "nothing scheduled" message.
4. Moving to the previous or next month refetches and the marks match that month.
5. The screen opens with today selected.
6. The month grid is rendered by the shadcn `Calendar` component — no hand-built grid, no
   calendar library beyond react-day-picker.
7. Signed in as a second person, only that person's days are marked.

## Done when

Demonstrated in the browser against seeded data for two accounts: marks correct, day selection
correct, empty-day message present, month navigation re-marks, and no cross-account leakage.

## Depends on

Frontend **US-09**; backend **US-04**.
