# US-12 — Edit and delete an appointment

**Layer**: Frontend · **Priority band**: P4 (edit and delete) · **Cut position**: 4 of 6.

## Story

As a signed-in person, I want to correct or cancel an appointment from the day's list, so that
a typo or a cancelled meeting does not sit in my calendar being wrong.

## Traces to

- Spec user story: **US-4 — Change or remove an appointment**
- Requirements: **FR-018, FR-019, FR-020**
- Clarification: **Q3 — confirmation dialog, permanent, no undo**
- Backend stories consumed: **US-06, US-07**, then **US-04** to refresh
- Success criteria: **SC-004**

## Behaviour

- Each appointment in the day's list carries an edit control and a delete control.
- Edit reuses the **same form component** as US-11, pre-filled with current values — one form,
  two modes. Building a second form would be duplicated validation for no benefit.
- Saving an edit updates the list in place; changing the date moves the appointment and both
  affected days' marks update.
- Delete opens a shadcn `AlertDialog` asking for confirmation. Confirming removes the
  appointment permanently. There is no undo, no toast offering to restore.
- A day that loses its last appointment loses its mark.

## Acceptance criteria

1. The edit form opens pre-filled with the appointment's current title, notes, date, start, and
   end.
2. Saving changed values updates the day's list immediately.
3. Changing the date removes the appointment from the original day and adds it to the new one;
   both days' marks update.
4. The same validation refusals as creation appear, with the same messages.
5. Delete asks for confirmation before anything happens.
6. Cancelling the confirmation leaves the appointment untouched.
7. Confirming removes it from the list immediately, with no undo offered anywhere.
8. A day holding exactly one appointment loses its mark when that appointment is deleted or
   moved away.

## Done when

Demonstrated in the browser: edit a title and times, move an appointment across dates and watch
both marks change, cancel a delete, then confirm a delete and watch the mark disappear.

## Depends on

Frontend **US-11** (shares its form); backend **US-06, US-07**.
