# US-09 — Sign-up, sign-in, and the route guard

**Layer**: Frontend · **Priority band**: P1 (accounts and sign-in) · **Cut position**: 1 of 6 —
never cut.

## Story

As a person using the app, I want to register or sign in on screen and stay signed in as I move
around, so that I reach my own calendar and nobody reaches it without signing in.

## Traces to

- Spec user story: **US-1 — Get an account and sign in**
- Requirements: **FR-001, FR-002, FR-003, FR-005, FR-006, FR-007**
- Clarification: **Q1 — 8-hour session, expiry returns to sign-in**
- Backend stories consumed: **US-01, US-02, US-03**
- Success criteria: **SC-001**

## Behaviour

- A sign-up screen and a sign-in screen, each a form with email and password.
- Auth state lives in a **React Context** — no state management library. The context holds the
  session token and the signed-in email, and exposes sign-in, sign-up, and sign-out.
- The token is persisted so a page reload does not sign the person out.
- A route guard sends anyone without a valid session to the sign-in screen when they try to
  reach any other screen.
- A refusal from the server is shown inline on the form — duplicate email, wrong credentials,
  bad password length — without exposing anything the server did not say.
- A rejected request due to an expired session clears the stored session and returns the person
  to the sign-in screen.
- Signing out clears the session and returns to sign-in.

## Acceptance criteria

1. Registering a fresh email signs the person in and lands them on the agenda screen.
2. Registering an email already in use shows the server's message on the form and does not
   navigate.
3. Signing in with correct credentials lands on the agenda screen; wrong credentials show the
   generic refusal inline.
4. Reloading the page while signed in keeps the person signed in and on the same screen.
5. Typing the address of a protected screen while signed out lands on sign-in.
6. When the server rejects a call because the session expired, the person is returned to
   sign-in rather than shown a broken screen.
7. Signing out returns to sign-in, and the protected screens are closed again.

## Done when

Demonstrated in the browser: register, land, reload, sign out, sign back in, and confirm a
direct address to a protected screen while signed out bounces to sign-in.

## Depends on

Backend **US-01, US-02, US-03**. Every other frontend story depends on this one.
