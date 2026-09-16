# Clarifications: Appointment Scheduler

**Feature**: [spec.md](./spec.md)
**Session**: 2026-09-16
**Questions asked**: 5 of a maximum 5
**Outcome**: 4 answers took the cheapest option; 1 took a free variant of it.

Every question below offered a cheapest-option default, per the ship-today constraint in
Article I of the constitution. This file is the durable record; each answer has also been
folded into `spec.md` under `## Clarifications` and into the affected requirements.

---

## Q1 — Session lifetime

**Question**: How long should a sign-in last, and what happens when it expires?

**Answer**: **8 hours, then back to sign-in.**

**Why it was asked**: The spec said only "a fixed session", which is not testable. Lifetime and
renewal behaviour together decide whether any renewal machinery is needed at all.

**What it rules out**: silent renewal, sliding expiry, "remember me", any warning before
expiry, and — consistent with the out-of-scope list — refresh tokens.

**Spec impact**: FR-006 rewritten; User Story 1 gained acceptance scenario 7; the
session-expiry edge case now names 8 hours; assumption updated.

**Cost note**: 8 hours is a single configuration value. It also means you will not be logged
out during today's build or demo, which 1 hour would have guaranteed.

---

## Q2 — Time entry granularity

**Question**: How should the person enter start and end times?

**Answer**: **A free time field accepting any minute.**

**Why it was asked**: A preset slot list changes the data model's constraints, the validation,
and the create/edit form. It is the kind of decision that is cheap now and expensive later.

**What it rules out**: 15- or 30-minute slot dropdowns and the list-maintenance and matching
validation that come with them.

**Spec impact**: FR-015a added; assumption on same-day appointments extended to cover
granularity.

**Cost note**: The native time field is free. The same-day, end-after-start rules are unchanged
and still enforced on the server.

---

## Q3 — Delete behaviour

**Question**: What should happen when the person deletes an appointment?

**Answer**: **An explicit confirmation step, then permanent deletion.**

**Why it was asked**: Undo is the difference between a delete endpoint and a delete endpoint
plus retained state plus a finalization timer.

**What it rules out**: undo windows, trash, archive, restore, and soft delete (already banned
by Article IX).

**Spec impact**: FR-019 now states explicitly that no undo, restore, or archive exists;
assumption confirmed.

**Cost note**: One confirmation dialog. It buys protection from the accidental click without
any retention mechanism behind it.

---

## Q4 — Landing screen versus calendar screen

**Question**: After signing in, should today's agenda and the month calendar be one screen or
two?

**Answer**: **Two screens. Signing in lands on the agenda; the month calendar is a navigation
click away, and the person can move between them freely.**

**Why it was asked**: This is the highest-impact answer of the five for the cut line. Two
screens keep the P5 agenda story and the P2 calendar story in separate components, so dropping
P5 late in the day removes a route rather than requiring surgery on the calendar screen.

**What it rules out**: a single combined dashboard where agenda and calendar share state, and
the variant where the agenda is merely the day panel with today selected.

**Spec impact**: User Story 2 and User Story 5 both restated; User Story 5 gained acceptance
scenario 4 for navigation; FR-008 and FR-021 rewritten; new assumption recorded.

**Cost note**: Slightly more routing, materially less coupling — and the coupling is what would
cost time if the day runs short.

---

## Q5 — Email body format

**Question**: What should the "email me today's schedule" message look like?

**Answer**: **Plain text, one line per appointment, with a subject line naming today's date.**

**Why it was asked**: Styled email HTML is a known time sink, and the subject format is worth
pinning while the question is open rather than deciding it inside an implementation task.

**What it rules out**: HTML bodies and inline email styling, attachments, and calendar
invitations.

**Spec impact**: FR-023a added; assumption updated to include the dated subject line.

**Cost note**: Free relative to the plain-text default — the developer chose the variant that
also fixes the subject line, which is a string format, not extra work.

---

## Assumptions still standing (not asked, deliberately)

These remain as recorded in the **Assumptions** section of `spec.md`. Each was judged low
enough impact, or low enough uncertainty, that spending one of the five questions on it would
have cost more than being wrong would.

| Assumption | Why it was not asked |
|---|---|
| One person, one account, no sharing | Teams and sharing are far outside the stated scope; no plausible alternative reading. |
| Password minimum of 8 characters, no composition rules | Changing the number later is a one-line edit in one validator. |
| Generic message on failed sign-in | Already the security-correct default; the alternative leaks which addresses are registered. |
| All dates and times are the device's local values | Timezones are explicitly out of scope by Article IX. |
| Two appointments may occupy the same time | Overlap detection is explicitly out of scope. |
| Title 1–200 characters, notes up to 1000 | Arbitrary but harmless; both are single-attribute constraints. |
| Every appointment for a day shown at once | Pagination is explicitly out of scope. |
| Email goes to the unverified registration address, unchangeable | Email verification and profile editing are both out of scope. |
| Single local user, no scale or availability requirement | The environment is a developer machine; no realistic alternative. |

---

## Coverage after this session

| Taxonomy category | Status |
|---|---|
| Functional scope & behaviour | Clear — six prioritized stories with a stated cut line |
| Domain & data model | Clear — two entities, attributes and ownership fixed |
| Interaction & UX flow | **Resolved** — screen split (Q4), time entry (Q2), delete flow (Q3) |
| Non-functional: security & privacy | **Resolved** — session lifetime (Q1); ownership rules already in FR-027/028 |
| Non-functional: performance, scale, reliability | Clear — single local user, 2-second response criterion |
| Non-functional: observability | Outstanding, low impact — no logging requirement stated; not needed to ship today |
| Integration & external dependencies | **Resolved** — email format and trigger fixed (Q5, FR-024) |
| Edge cases & failure handling | Clear — 11 cases, including session expiry and mail failure |
| Constraints & tradeoffs | Deferred to `plan.md` — this is implementation method, correctly out of the spec |
| Terminology & consistency | Clear — "person", "appointment", "agenda", "day panel" used consistently |
| Completion signals | Clear — 8 measurable success criteria |
| Placeholders / TODOs | Clear — none remain |

**Recommendation**: proceed. No outstanding item blocks planning, and the one Outstanding entry
(observability) is a deliberate omission under Article IX rather than a gap.
