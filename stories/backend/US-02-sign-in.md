# US-02 — Sign in and receive a session token

**Layer**: Backend · **Priority band**: P1 (accounts and sign-in) · **Cut position**: 1 of 6 —
never cut.

## Story

As a registered person, I want to sign in with my email and password, so that I get a session
that proves who I am for the rest of my work.

## Traces to

- Spec user story: **US-1 — Get an account and sign in**
- Requirements: **FR-005, FR-006**
- Clarification: **Q1 — 8-hour session, no silent renewal**
- Success criteria: **SC-001**

## Behaviour

- Accepts an email address and a password.
- Verifies the password against the stored hash.
- On success, issues a session token valid for **8 hours**, carrying the person's identity.
- On failure — unknown email or wrong password — returns one generic refusal that does not
  reveal which of the two was wrong.
- Never renews a session silently. When the 8 hours elapse, the token stops being accepted.

## Provisional contract

`POST /api/auth/login` — request `{ email, password }`, response `{ token, email }`.

## Acceptance criteria

1. Correct email and password return a token.
2. The issued token expires 8 hours after issue, and is rejected afterwards.
3. A wrong password returns a 401-class refusal with a generic message.
4. An unregistered email returns the **same** generic message and the same status as a wrong
   password, so the response cannot be used to discover which addresses are registered.
5. No response body from this endpoint ever contains the password or the password hash.

## Done when

Proven in Swagger: sign in with the account from US-01 and get a token; decode the token and
confirm the expiry is 8 hours out and the identity claim is present; confirm wrong password and
unknown email produce byte-identical refusals.

## Depends on

**US-01** (an account must exist to sign in to).
