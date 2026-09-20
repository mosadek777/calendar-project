# Feature Specification: Appointment Scheduler

**Feature Branch**: `main` (spec directory: `001-scheduler`)

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "A person registers with email and password, signs in, and sees today's agenda on landing. They browse a month calendar where days holding appointments are visibly marked, pick a day, and see that day's appointments. They can create an appointment on the selected day (title, optional notes, date, start time, end time), edit it, and delete it. They can press a button to email themselves today's schedule. Each person sees only their own appointments."

## Clarifications

### Session 2026-09-16

- Q: How long should a sign-in last, and what happens when it expires? → A: 8 hours, then the
  next action returns the person to sign-in. No silent renewal, no "remember me".
- Q: How should the person enter start and end times? → A: A free time field accepting any
  minute. No preset slot list. End must still be after start, both on the same calendar day.
- Q: What should happen when the person deletes an appointment? → A: An explicit confirmation
  step, then permanent deletion. No undo, no restore, no archive.
- Q: After signing in, should today's agenda and the month calendar be one screen or two? →
  A: Two screens. Signing in lands on the agenda; the month calendar is reached by a
  navigation control, and the person can move between them freely.
- Q: What should the "email me today's schedule" message look like? → A: Plain text, one line
  per appointment, with a subject line naming today's date. No HTML, no attachment.

## User Scenarios & Testing *(mandatory)*

The six stories below are ordered by priority, and **that order is the cut line**: if the day
runs out, the lowest-numbered incomplete story is what ships, and everything below it is
dropped. Each story is independently demonstrable.

### User Story 1 - Get an account and sign in (Priority: P1)

A new person opens the application, creates an account with their email address and a
password, and is signed in. On a later visit they sign in with the same email and password.
Anything that is not the sign-up or sign-in screen is closed to a person who is not signed in,
and signing out returns them to the sign-in screen.

**Why this priority**: Appointments belong to a person. Without an identity there is nobody to
own them, nothing to protect, and no address to email a schedule to. Nothing else in this
feature can exist first.

**Independent Test**: Register a brand-new email address, land inside the application, sign
out, sign back in with the same credentials, and confirm that typing the address of an
internal screen while signed out sends you back to sign-in. This alone proves the identity
boundary works, even with no appointment features present.

**Acceptance Scenarios**:

1. **Given** an email address that has never been registered, **When** the person submits it
   with a password that meets the stated rules, **Then** the account is created and the person
   is signed in.
2. **Given** an email address that is already registered, **When** someone tries to register it
   again, **Then** registration is refused with a message saying the email is already in use,
   and no second account exists.
3. **Given** a registered account, **When** the person signs in with the correct email and
   password, **Then** they are signed in and taken to the landing screen.
4. **Given** a registered account, **When** the person signs in with a wrong password, **Then**
   sign-in is refused with a message that does not reveal whether the email exists.
5. **Given** a person who is not signed in, **When** they try to reach any screen other than
   sign-up or sign-in, **Then** they are sent to the sign-in screen.
6. **Given** a signed-in person, **When** they sign out, **Then** their session ends and
   internal screens are closed to them again.
7. **Given** a session that began more than 8 hours ago, **When** the person takes their next
   action, **Then** they are returned to the sign-in screen and must sign in again.

---

### User Story 2 - See the month and pick a day (Priority: P2)

A signed-in person reaches the month calendar screen from a navigation control. Days that hold
at least one of their appointments
are visibly marked, so the shape of the month is readable at a glance. Clicking a day selects
it, and that day's appointments are listed in a panel beside or below the calendar, in time
order. Moving to the previous or next month re-marks the days for the month now on screen.

**Why this priority**: This is the product's reason to exist — seeing where your commitments
sit in a month. It is also the surface every later story hangs off: creating, editing, and
deleting all start from a selected day.

**Independent Test**: With appointments already present in the data, sign in, confirm the
marked days match the days that hold appointments, click a marked day and see its
appointments listed in time order, click an unmarked day and see an empty-day message, then
page to another month and confirm the marks update.

**Acceptance Scenarios**:

1. **Given** a signed-in person with appointments on some days of the displayed month,
   **When** the calendar is shown, **Then** exactly those days carry a visible mark and no
   others do.
2. **Given** the calendar is shown, **When** the person clicks a marked day, **Then** that
   day's appointments appear listed in ascending start-time order, each showing at least its
   title and its start and end time.
3. **Given** the calendar is shown, **When** the person clicks a day with no appointments,
   **Then** the panel shows a clear "nothing scheduled" message rather than an empty box.
4. **Given** the calendar is shown, **When** the person moves to the previous or next month,
   **Then** the marks shown reflect that month's appointments.
5. **Given** two people each have appointments, **When** one of them views the calendar,
   **Then** only their own appointments are marked and listed; the other person's are never
   visible.

---

### User Story 3 - Add an appointment to a day (Priority: P3)

With a day selected, the person adds an appointment by giving it a title, an optional note, a
date, a start time, and an end time. The date defaults to the selected day. When it is saved,
it appears immediately in that day's list and the day becomes marked on the calendar.

**Why this priority**: A calendar you cannot write to is a report. This is the first story
that lets the person put their own data in, and it is the minimum needed for the product to
be usable for real.

**Independent Test**: Select a day with nothing on it, add an appointment, and confirm it
appears in the day's list and the day is now marked — without reloading the page.

**Acceptance Scenarios**:

1. **Given** a selected day, **When** the person opens the create form, **Then** the date is
   pre-filled with the selected day.
2. **Given** the create form is open, **When** the person submits a title, a date, a start
   time, and an end time that is later than the start time, **Then** the appointment is saved
   and appears in that day's list in the correct time position.
3. **Given** the create form is open, **When** the person submits without a title, **Then**
   the appointment is not saved and a message identifies the title as required.
4. **Given** the create form is open, **When** the person submits an end time that is the same
   as or earlier than the start time, **Then** the appointment is not saved and a message says
   the end time must be after the start time.
5. **Given** a day that was previously unmarked, **When** an appointment is saved on it,
   **Then** that day becomes marked on the calendar without the person reloading.
6. **Given** the notes field is left empty, **When** the appointment is saved, **Then** it
   saves successfully with no note.

---

### User Story 4 - Change or remove an appointment (Priority: P4)

From a day's list, the person opens one of their appointments, changes any of its details —
including moving it to a different date — and saves. Or they delete it, confirming first, and
it disappears from the list. A day that loses its last appointment stops being marked.

**Why this priority**: Plans change, and a scheduler that cannot correct a typo or cancel a
meeting is barely trustworthy. It ranks below creation because a person can work around a bad
entry by deleting-and-recreating only if delete exists — so the pair ships together, after
creation is solid.

**Independent Test**: Create an appointment, edit its title and times and confirm the list
reflects the change, move it to another date and confirm both days' marks update, then delete
it and confirm it is gone.

**Acceptance Scenarios**:

1. **Given** an appointment in a day's list, **When** the person opens it for editing,
   **Then** the form is pre-filled with its current title, notes, date, start time, and end
   time.
2. **Given** the edit form is open, **When** the person changes details and saves, **Then**
   the changes are stored and the day's list shows the updated values.
3. **Given** the edit form is open, **When** the person changes the date to a different day
   and saves, **Then** the appointment leaves the original day's list and appears on the new
   day, and both days' calendar marks update accordingly.
4. **Given** the edit form is open, **When** the person submits values that break the same
   rules as creation (missing title, end time not after start time), **Then** the change is
   refused with the same messages and nothing is stored.
5. **Given** an appointment in a day's list, **When** the person chooses to delete it and
   confirms, **Then** it is permanently removed and disappears from the list.
6. **Given** a day holding exactly one appointment, **When** that appointment is deleted or
   moved away, **Then** the day is no longer marked on the calendar.
7. **Given** an appointment belonging to another person, **When** someone attempts to view,
   change, or delete it, **Then** the attempt fails and reveals nothing about whether that
   appointment exists.

---

### User Story 5 - Land on today's agenda (Priority: P5)

Immediately after signing in, the person lands on an agenda screen showing today's
appointments — the day's commitments in time order — without having to hunt for today on the
calendar. If today is empty, the screen says so plainly. The month calendar is a separate
screen, one navigation click away, and the person can move between the two freely.

**Why this priority**: It is the daily-use payoff and the first thing a returning person wants
to see, but it is a convenience view over data the earlier stories already expose. If it is
dropped, the person can still click today on the calendar and get the same information.

**Independent Test**: With appointments on today and on other days, sign in and confirm the
landing screen lists exactly today's, in time order, and nothing else.

**Acceptance Scenarios**:

1. **Given** a person with appointments today, **When** they finish signing in, **Then** the
   landing screen lists exactly today's appointments in ascending start-time order.
2. **Given** a person with no appointments today but some on other days, **When** they finish
   signing in, **Then** the landing screen says plainly that nothing is scheduled today.
3. **Given** the landing screen, **When** the person looks at it, **Then** each listed
   appointment shows at least its title and its start and end time.
4. **Given** the agenda screen, **When** the person uses the navigation control, **Then** they
   reach the month calendar screen, and can return to the agenda the same way.

---

### User Story 6 - Email myself today's schedule (Priority: P6)

The person presses a clearly labelled button and receives an email at their registered address
containing today's appointments. Nothing is ever sent unless the button is pressed. The screen
confirms that the email was sent, or tells them plainly if it could not be sent.

**Why this priority**: It is a genuine nice-to-have on top of a complete scheduler. If time
runs out, this is the first thing dropped, and the person loses nothing they cannot read on
screen.

**Independent Test**: With appointments on today, press the button and confirm an email
arrives at the registered address listing exactly today's appointments in time order, and that
no email arrives at any other time.

**Acceptance Scenarios**:

1. **Given** a signed-in person with appointments today, **When** they press the button,
   **Then** one email is sent to their registered address listing today's appointments in
   ascending start-time order with title and times.
2. **Given** a signed-in person with no appointments today, **When** they press the button,
   **Then** an email is still sent, stating plainly that nothing is scheduled today.
3. **Given** the button has been pressed, **When** the email is accepted for delivery,
   **Then** the screen confirms it was sent to the person's address.
4. **Given** the email cannot be sent, **When** the person presses the button, **Then** the
   screen says the email could not be sent, and no part of the person's schedule is lost or
   changed.
5. **Given** a person who never presses the button, **When** any amount of time passes,
   **Then** no email is ever sent to them.

---

### Edge Cases

- **Email already registered**: registration is refused with a clear message; no duplicate
  account is created.
- **Wrong password or unknown email at sign-in**: refused with a single message that does not
  reveal which of the two was wrong.
- **Session expires while the person is working**: 8 hours after signing in, the next action
  they take sends them back to sign-in rather than failing silently or showing a blank screen.
  There is no warning beforehand and no silent renewal.
- **End time equal to or before start time**: refused on both create and edit, with the same
  message.
- **Appointment ending at or crossing midnight**: an appointment must start and end on the same
  calendar day; an end time of midnight or earlier than the start is refused.
- **Two appointments at the same time on the same day**: allowed. Overlap detection is out of
  scope; the day's list simply shows both.
- **Very long title or notes**: refused above the stated length limits, with a message naming
  the limit.
- **Appointment belonging to someone else**: any attempt to read, change, or delete it fails
  as though the appointment does not exist.
- **A day with many appointments**: all of them are listed for that day; there is no paging.
- **Deleting an appointment that was already deleted**: the second attempt fails cleanly with a
  not-found message and nothing breaks.
- **Emailing when the mail service is unavailable**: the person is told the email failed; their
  appointments are untouched.

## Requirements *(mandatory)*

### Functional Requirements

**Accounts and access (P1)**

- **FR-001**: The system MUST let a person create an account with an email address and a
  password.
- **FR-002**: The system MUST reject registration when the email address already belongs to an
  account, and MUST say so.
- **FR-003**: The system MUST reject an email address that is not a well-formed address, and a
  password shorter than 8 characters.
- **FR-004**: The system MUST store passwords only in an unreadable, irreversible form, and
  MUST never display, return, or record a password in readable form.
- **FR-005**: The system MUST let a registered person sign in with their email and password,
  and MUST refuse incorrect credentials with a message that does not reveal whether the email
  is registered.
- **FR-006**: The system MUST keep the person signed in across page reloads for 8 hours from
  sign-in, MUST return them to the sign-in screen on their first action after that, and MUST
  let them sign out at any time, ending the session immediately. The system MUST NOT renew a
  session silently.
- **FR-007**: The system MUST close every screen other than sign-up and sign-in to people who
  are not signed in, redirecting them to sign-in.

**The month calendar and the day panel (P2)**

- **FR-008**: The system MUST show a month calendar to a signed-in person on a screen separate
  from the agenda screen, MUST provide a navigation control that reaches it, and MUST let the
  person return to the agenda the same way.
- **FR-009**: The system MUST visibly mark every day of the displayed month on which that
  person has at least one appointment, and MUST NOT mark days on which they have none.
- **FR-010**: The system MUST let the person select a day and MUST list that day's
  appointments in ascending start-time order, each showing at least title, start time, and end
  time.
- **FR-011**: The system MUST show a plain "nothing scheduled" message when the selected day
  has no appointments.
- **FR-012**: The system MUST update the marked days when the person moves to a different
  month.

**Creating appointments (P3)**

- **FR-013**: The system MUST let a person create an appointment with a title, an optional
  note, a date, a start time, and an end time, defaulting the date to the currently selected
  day.
- **FR-014**: The system MUST require a title of 1 to 200 characters and MUST limit notes to
  1000 characters.
- **FR-015**: The system MUST require an end time strictly later than the start time on the
  same calendar day, and MUST refuse the appointment otherwise with a message saying so.
- **FR-015a**: The system MUST accept any start or end time to the minute, and MUST NOT
  restrict entry to a preset list of time slots.
- **FR-016**: The system MUST enforce every validation rule on the server, independently of
  whatever the screen checks, so that a request bypassing the screen cannot store invalid data.
- **FR-017**: The system MUST show a newly created appointment in the day's list and mark its
  day on the calendar without the person reloading the page.

**Editing and deleting (P4)**

- **FR-018**: The system MUST let a person change any detail of one of their own appointments,
  including its date, applying the same validation rules as creation.
- **FR-019**: The system MUST let a person permanently delete one of their own appointments,
  after an explicit confirmation step, and MUST NOT offer any undo, restore, or archive — once
  confirmed, the appointment is gone.
- **FR-020**: The system MUST update the calendar marks and the day list after an edit or a
  delete, including removing the mark from a day that no longer holds any appointment.

**Today's agenda (P5)** — *conditional. This band is the second to be dropped if time runs
out. If dropped, signing in lands on the month calendar, which already opens with today
selected, and FR-021 and FR-022 are knowingly unmet. A compliance audit should read these two
as satisfied-or-dropped, not as failures.*

- **FR-021**: The system MUST show the person's appointments for the current local date, in
  ascending start-time order, on a dedicated agenda screen that is the screen they land on
  immediately after signing in.
- **FR-022**: The system MUST state plainly on that screen when nothing is scheduled today.

**Emailing a day's schedule (P6)** — *conditional. This band is the first to be dropped if time
runs out, and it is dropped whole: FR-023 through FR-026 stand or fall together, because an
endpoint with no button, or a button with no endpoint, is worse than neither. If dropped, the
person reads the schedule on screen and loses no information.*

> **Widened during Phase 7**, from "today's schedule" to "the selected day's schedule". Once
> US-13 was dropped, the calendar's day panel became the main view, so scoping the button to
> the day already on screen is the coherent behaviour. Today remains the default, because the
> calendar opens with today selected.

- **FR-023**: The system MUST provide a clearly labelled control that, when pressed, sends the
  signed-in person an email at their registered address containing **the selected day's**
  appointments in ascending start-time order. Because the calendar opens with today selected,
  pressing it on arrival sends today's schedule.
- **FR-023a**: That email MUST be plain text — one line per appointment showing start time,
  end time, and title, with any note beneath it — and MUST carry a subject line naming **that
  day's** date. The system MUST NOT send HTML, attachments, or calendar invitations.
- **FR-024**: The system MUST send that email only in response to that control being pressed,
  and MUST NOT send email on any schedule, timer, or automatic trigger.
- **FR-025**: The system MUST send an email stating that nothing is scheduled when the person
  has no appointments on the selected day.
- **FR-026**: The system MUST tell the person on screen whether the email was sent or failed,
  and MUST leave their appointments unchanged either way.

**Ownership and privacy (applies throughout)**

- **FR-027**: The system MUST treat every appointment as owned by exactly one person, and MUST
  determine the acting person from their signed-in session, never from anything the screen
  sends about who they are.
- **FR-028**: The system MUST make one person's appointments entirely invisible and
  unreachable to every other person — in the calendar marks, the day list, the agenda, the
  email, and any direct attempt to read, change, or delete a specific appointment.

### Key Entities

- **Person (account holder)**: someone who signs in and owns appointments. Identified by a
  unique email address, which is also where their schedule email is sent. Holds a protected
  password and the moment the account was created.
- **Appointment**: one commitment belonging to exactly one person. Carries a title, an
  optional note, the calendar day it falls on, a start time and an end time on that day, and
  the moment it was created. An appointment never belongs to two people and never exists
  without an owner.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A brand-new person can go from the sign-up screen to seeing today's agenda in
  under 60 seconds, without instructions.
- **SC-002**: Looking at the month calendar, a person can identify every day that holds an
  appointment without clicking any day.
- **SC-003**: A person can add an appointment to a chosen day in under 30 seconds and see it
  appear in that day's list immediately, with no page reload.
- **SC-004**: A person can correct a mistake in an existing appointment, or remove it
  entirely, in under 30 seconds from the day's list.
- **SC-005**: 100% of attempts by one person to read, change, or delete another person's
  appointment fail, and reveal nothing about that appointment's existence.
- **SC-006**: 100% of invalid submissions (missing title, end time not after start time,
  over-length text) are refused, including submissions that bypass the on-screen form.
- **SC-007**: After pressing the email button, the person receives an email listing exactly
  today's appointments, and receives zero emails at any other time.
- **SC-008**: Every screen action the person takes returns a visible result — a change, a
  list, or a message — within 2 seconds under single-user local conditions.

## Assumptions

These are reasonable defaults chosen where the description was silent. They are the material
for the clarification phase; each one can be overturned there at low cost.

- **One person, one account, no sharing.** There is no concept of teams, invitations, shared
  calendars, or anyone acting on another person's behalf.
- **Password rule is a minimum of 8 characters**, with no composition requirement, chosen to
  keep sign-up fast without being careless.
- **Sign-in lasts 8 hours** (confirmed in clarification), then the next action returns the
  person to sign-in. No silent renewal, no "remember me", no warning before expiry.
- **A failed sign-in gives one generic message** rather than distinguishing unknown email from
  wrong password, so the screen does not confirm which addresses are registered.
- **All dates and times are the calendar dates and clock times of the person's own device.**
  There is no timezone handling, conversion, or display of a zone anywhere.
- **An appointment starts and ends on the same calendar day** (confirmed in clarification).
  Nothing spans midnight, and times are entered freely to the minute rather than chosen from
  preset slots.
- **Two appointments may occupy the same time.** The system never warns about or prevents an
  overlap.
- **Title is required, 1–200 characters; notes are optional, up to 1000 characters.**
- **Deletion is permanent and immediate** after confirmation (confirmed in clarification);
  there is no archive, trash, or undo.
- **Every appointment for a day is shown at once**, with no paging or "show more", because a
  personal day rarely holds enough entries to need it.
- **The email contains today's schedule as plain readable text** (confirmed in clarification)
  — one line per appointment with start time, end time, and title, notes beneath — under a
  subject line naming today's date, with no HTML, attachment, calendar invitation, or links.
- **The agenda and the month calendar are two separate screens** (confirmed in clarification).
  Signing in lands on the agenda; a navigation control moves between the two.
- **The email goes to the address the person registered with**, which is never verified and
  cannot be changed in this version.
- **A single person uses the system at a time on a local machine**; there is no concurrent-use,
  scale, or availability requirement.
