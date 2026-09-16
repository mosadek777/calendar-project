# US-13 — Today's agenda as the landing screen

**Layer**: Frontend · **Priority band**: P5 (today's agenda) · **Cut position**: 5 of 6 — the
second thing dropped if the day runs out.

## Story

As a signed-in person, I want to land on today's appointments the moment I sign in, so that my
day is the first thing I see without hunting for today on a calendar.

## Traces to

- Spec user story: **US-5 — Land on today's agenda**
- Requirements: **FR-021, FR-022**
- Clarification: **Q4 — agenda and calendar are two separate screens**
- Backend stories consumed: **US-04** (single-day range for today)
- Success criteria: **SC-001**

## Behaviour

- A dedicated agenda screen. Signing in and signing up both land here.
- Lists today's appointments in ascending start-time order, each showing title, start time, and
  end time.
- States plainly that nothing is scheduled when today is empty.
- Carries the navigation control that reaches the calendar screen, and the calendar screen
  carries one back.

## If this story is cut

Signing in lands on the **calendar screen** instead, which already opens with today selected
and its appointments in the day panel. The person loses a dedicated screen, not information.
This is exactly why the two screens were kept separate in clarification Q4 — cutting this
removes a route and changes one redirect target, and touches nothing inside US-10.

## Acceptance criteria

1. Signing in lands on the agenda screen.
2. With appointments today, exactly today's are listed, in ascending start-time order, with
   title and both times.
3. With nothing today but appointments on other days, the screen says nothing is scheduled
   today and lists nothing.
4. The navigation control reaches the calendar screen, and the calendar screen returns here.
5. Signing up, not just signing in, also lands here.

## Depends on

Frontend **US-09**; backend **US-04**. Nothing depends on this story, which is what makes it
safe to cut.
