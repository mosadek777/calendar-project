# US-14 — The "email me today's schedule" button

**Layer**: Frontend · **Priority band**: P6 (manual email) · **Cut position**: 6 of 6 — **the
first thing dropped, together with backend US-08.**

## Story

As a signed-in person, I want a button that emails me today's schedule, so that I can take my
day with me without keeping the app open.

## Traces to

- Spec user story: **US-6 — Email myself today's schedule**
- Requirements: **FR-023, FR-026**
- Constitution: **Article VIII — triggered by the button, never by a scheduler**
- Backend stories consumed: **US-08**
- Success criteria: **SC-007**

## Behaviour

- A clearly labelled button on the agenda screen — or on the calendar screen if US-13 was cut.
- Pressing it calls the backend once. The button is disabled while the call is in flight so a
  double-click cannot send two emails.
- Success shows a confirmation naming the address the email went to.
- Failure shows a plain message that the email could not be sent. Nothing about the person's
  appointments changes either way.
- Nothing on this screen ever sends an email on its own — no interval, no effect that fires on
  mount, no retry loop.

## Acceptance criteria

1. Pressing the button sends exactly one email, visible in the local mail catcher.
2. While the request is in flight the button is disabled, and a rapid double-click produces one
   email, not two.
3. On success the screen confirms the send and names the address.
4. With the mail service stopped, the screen says the email could not be sent, and the
   appointment list is unchanged.
5. Leaving the screen open without pressing the button produces zero emails.

## Done when

Demonstrated in the browser with the local mail catcher open: one press, one message; the
double-click case; the failure case with the catcher stopped; and the idle case producing
nothing.

## Depends on

Frontend **US-09**, backend **US-08**. Nothing depends on this story.
