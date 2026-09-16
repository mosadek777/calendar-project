# US-03 — Protect appointment endpoints and identify the caller

**Layer**: Backend · **Priority band**: P1 (accounts and sign-in) · **Cut position**: 1 of 6 —
never cut. This is the story that makes every later story safe.

## Story

As a signed-in person, I want every appointment operation to know who I am from my session
alone, so that nobody can reach my appointments by guessing or by claiming to be me.

## Traces to

- Spec user story: **US-1**, and the ownership rules that run through **US-2, US-3, US-4, US-5,
  US-6**
- Requirements: **FR-007, FR-027, FR-028**
- Constitution: **Article VI — Identity and Ownership**
- Success criteria: **SC-005**

## Behaviour

- Every appointment endpoint requires a valid, unexpired session token; an anonymous or expired
  request is refused before any work happens.
- The acting person's identity is read from the token's claims **inside the service layer**.
- No endpoint accepts an owner identity from a route value, query string, or request body. If a
  client sends one, it is ignored entirely.
- Any request for an appointment owned by somebody else fails as not-found, revealing nothing
  about whether that appointment exists.

## Acceptance criteria

1. Calling any appointment endpoint with no token returns 401.
2. Calling with a malformed or tampered token returns 401.
3. Calling with a token issued more than 8 hours ago returns 401.
4. With person A's token, requesting person B's appointment by its id returns **404**, not 403
   — the response is indistinguishable from an id that does not exist.
5. Adding an owner id to a request body or query string changes nothing; the identity used is
   always the one in the token.
6. The registration and sign-in endpoints remain reachable without a token.

## Done when

Proven in Swagger with two registered accounts: A cannot see, change, or delete any of B's
appointments by id, unauthenticated calls are refused, and an owner id planted in a request
body has no effect.

## Depends on

**US-02** (a token must be issuable before it can be required). Its guarantees are exercised by
every story from US-04 onward.
