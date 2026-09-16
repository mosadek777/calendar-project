# US-01 — Register an account

**Layer**: Backend · **Priority band**: P1 (accounts and sign-in) · **Cut position**: 1 of 6 —
never cut; nothing works without it.

## Story

As a new person, I want to create an account with my email address and a password, so that my
appointments have an owner and somewhere to be sent.

## Traces to

- Spec user story: **US-1 — Get an account and sign in**
- Requirements: **FR-001, FR-002, FR-003, FR-004**
- Success criteria: **SC-001**

## Behaviour

- Accepts an email address and a password.
- Rejects a malformed email address.
- Rejects a password shorter than 8 characters.
- Rejects an email address that already belongs to an account, saying the email is in use.
- Stores the password only as an irreversible hash. The plain password is never stored,
  returned, or written to a log.
- On success, creates the account and returns the same signed-in result as sign-in (US-02), so
  the person does not have to sign in again immediately.

## Provisional contract

`POST /api/auth/register` — request `{ email, password }`, response `{ token, email }`.
Final shape is fixed in `specs\001-scheduler\contracts\` during Phase 5.

## Acceptance criteria

1. A never-registered, well-formed email with an 8+ character password creates exactly one
   account and returns a token.
2. Re-registering the same email returns a 409-class refusal naming the email as in use, and
   creates no second account.
3. A malformed email is refused with a validation message; no account is created.
4. A 7-character password is refused with a validation message; no account is created.
5. Reading the stored row shows a hash, never the submitted password.
6. Validation is enforced on the server — a request sent directly, bypassing any form, is
   refused by the same rules.

## Done when

Proven in Swagger: register succeeds, duplicate is refused, bad email and short password are
refused, and the persisted `PasswordHash` column is inspected and contains no plain text.

## Depends on

Nothing. This is the first executable story.
