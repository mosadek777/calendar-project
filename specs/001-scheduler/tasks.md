# Tasks: Appointment Scheduler

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) ·
**Stories**: [../../stories/README.md](../../stories/README.md) · **Date**: 2026-09-16

> **Format note.** The tasks template uses `T001 [US1]`. The constitution's story-numbering rule
> mandates **`T-xx [US-yy]`**, so that is what is used here. Setup and verification tasks that
> serve no single story carry `[SETUP]` or `[VERIFY]` in the same position.
>
> `[P]` marks a task that can run in parallel with its neighbours — different files, no
> dependency on an unfinished task.

**80 tasks.** Order is the cut line from `plan.md`. Work top to bottom. **Everything below the
point you reach when the day ends is dropped**, and what exists still works.

---

## Phase 0 — Setup

No story label: this is the ground everything stands on.

- [ ] T-01 [SETUP] Verify MailDev is listening — `Test-NetConnection -ComputerName localhost -Port 1025` returns `TcpTestSucceeded: True`, and <http://localhost:1080> opens. If not, restart `maildev` before going further
- [X] T-02 [SETUP] Verify LocalDB is running — `sqllocaldb info MSSQLLocalDB`; start it with `sqllocaldb start MSSQLLocalDB` if stopped
- [X] T-03 [SETUP] Create the API project: `dotnet new webapi --use-controllers -n Scheduler.Api -o backend\Scheduler.Api`. **No solution file** — one project does not need one, and Article III allows nothing in the repo root. **`--use-controllers` is not optional**: without it .NET 8 scaffolds a minimal-API project with no `Controllers\` folder, no `AddControllers()` and no `MapControllers()`, and every controller task below would have to be retrofitted
- [X] T-04 [SETUP] Add packages to `backend\Scheduler.Api\Scheduler.Api.csproj`: `Microsoft.AspNetCore.Authentication.JwtBearer`, `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Design`, `Microsoft.Extensions.Identity.Core`, `Swashbuckle.AspNetCore`
- [X] T-05 [SETUP] Create exactly these folders under `backend\Scheduler.Api\`: `Controllers\`, `Services\`, `Data\`, `Models\`, `DTOs\`. No others — Article III
- [X] T-06 [SETUP] Write `backend\Scheduler.Api\appsettings.json` with **non-secret** `Jwt` (issuer, audience, 480-minute lifetime) and `Smtp` (FromAddress, FromName) keys only
- [X] T-07 [SETUP] Write `backend\Scheduler.Api\appsettings.Development.json` with the LocalDB connection string, a `Jwt:Key` of **at least 32 characters**, and `Smtp` host `localhost`, port `1025`, `EnableSsl: false`, empty `UserName`/`Password`. Confirm `git status` does **not** list this file — Article VI
- [X] T-08 [SETUP] [P] Create `backend\Scheduler.Api\DTOs\JwtOptions.cs` and `backend\Scheduler.Api\DTOs\SmtpOptions.cs` — directly in `DTOs\`, **not** in a subfolder, since Article III names the five permitted folders and these need no extra nesting — and bind both in `Program.cs` with `builder.Services.Configure<T>(builder.Configuration.GetSection("..."))`
- [X] T-09 [SETUP] Add a named CORS policy for `http://localhost:5173` in `backend\Scheduler.Api\Program.cs` **now**, not when it first blocks a request
- [X] T-10 [SETUP] Configure Swagger in `Program.cs` with a Bearer security definition, so the **Authorize** button exists for every later proof task

---

## Phase 1 — Foundational data layer

Blocking: every story below needs these. Nothing here is story-specific.

- [X] T-11 [SETUP] [P] Create `backend\Scheduler.Api\Models\User.cs` — `Id` (Guid, PK), `Email` (string, required, max 256), `PasswordHash` (string, required), `CreatedAt` (DateTime), navigation `ICollection<Appointment> Appointments`
- [X] T-12 [SETUP] [P] Create `backend\Scheduler.Api\Models\Appointment.cs` — `Id` (Guid, PK), `UserId` (Guid, required FK), `Title` (string, required, **max 200**), `Notes` (string?, **max 1000**), `Date` (**DateOnly**), `StartTime` (**TimeOnly**), `EndTime` (**TimeOnly**), `CreatedAt` (DateTime), navigation `User User`
- [X] T-13 [SETUP] Create `backend\Scheduler.Api\Data\SchedulerDbContext.cs` with `DbSet<User>` and `DbSet<Appointment>`, and in `OnModelCreating` declare: **unique index on `User.Email`**, index on `Appointment.UserId`, index on `(UserId, Date)`, and a required FK with cascade delete
- [X] T-14 [SETUP] Register the context in `Program.cs` with `AddDbContext<SchedulerDbContext>(o => o.UseSqlServer(...))` reading the connection string from configuration
- [X] T-15 [SETUP] Create and apply the migration: `dotnet ef migrations add InitialCreate` then `dotnet ef database update`, run from `backend\Scheduler.Api\`. Confirm both tables and all three indexes exist

---

## Phase 2 — Auth backend (US-01, US-02, US-03) · **Never cut**

**Goal**: register, sign in, and make every later endpoint refuse strangers.
**Independently testable**: entirely in Swagger, with no frontend in existence.

- [X] T-16 [US-01] [P] Create `backend\Scheduler.Api\DTOs\RegisterRequest.cs` — `Email` `[Required][EmailAddress][MaxLength(256)]`, `Password` `[Required][MinLength(8)]`
- [X] T-17 [US-02] [P] Create `backend\Scheduler.Api\DTOs\LoginRequest.cs` — `Email` `[Required][EmailAddress]`, `Password` `[Required]`. **Do not** add `[MinLength(8)]` here: at login it would leak that a short password was never valid
- [X] T-18 [US-01] [P] Create `backend\Scheduler.Api\DTOs\AuthResponse.cs` — `Token` and `Email` only. No `PasswordHash`, ever
- [X] T-19 [US-02] Create `backend\Scheduler.Api\Services\ITokenService.cs` and `TokenService.cs` — build a JWT from a `User`: claims `JwtRegisteredClaimNames.Sub` = `Id` and `email`, expiry **now + 8 hours**, signed HS256 with `IOptions<JwtOptions>.Value.Key`. Call `JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear()` first so the claim is written literally as `sub` and is not silently renamed
- [X] T-20 [US-01] Create `backend\Scheduler.Api\Services\IAuthService.cs` and `AuthService.cs` with `RegisterAsync` — lower-case the email, refuse a duplicate as a 409-shaped result, hash with `PasswordHasher<User>.HashPassword`, `await SaveChangesAsync()`, return a token
- [X] T-21 [US-02] Add `LoginAsync` to `AuthService.cs` — look up by lower-cased email, verify with `VerifyHashedPassword` (**never** `==`), and return **one identical generic failure** for both unknown email and wrong password
- [X] T-22 [US-01] Create `backend\Scheduler.Api\Controllers\AuthController.cs` — thin `POST register` (201) and `POST login` (200), both **without** `[Authorize]`, each calling exactly one service method
- [X] T-23 [US-03] Add JWT bearer authentication in `Program.cs` — `ValidateIssuer`, `ValidateAudience`, `ValidateLifetime`, `ValidateIssuerSigningKey` all `true`, and **`ClockSkew = TimeSpan.Zero`** so 8 hours means 8 hours. Call `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()` **before** configuring the scheme, so `sub` arrives as `sub` rather than being remapped to `ClaimTypes.NameIdentifier`. Add `UseAuthentication()` before `UseAuthorization()`
- [X] T-24 [US-03] Add a small helper in `backend\Scheduler.Api\Controllers\` that reads `User.FindFirstValue("sub")` as a `Guid`, for controllers to pass into services. **Read the same literal name T-19 writes** — relying on .NET's default claim-type mapping is what makes this silently return `null` when someone clears the map
- [X] T-25 [US-01] Register `IAuthService`, `ITokenService`, and `PasswordHasher<User>` in `Program.cs` DI
- [X] T-26 [US-01] **Prove in Swagger**: register succeeds; the same email a second time returns 409; a malformed email and a 7-character password each return 400. Then query the `Users` table and confirm `PasswordHash` contains no readable password
- [X] T-27 [US-02] **Prove in Swagger**: login returns a token; paste it into <https://jwt.io> and confirm the `sub` claim and an `exp` 8 hours out; confirm wrong password and unknown email return **identical** bodies and status

---

## Phase 3 — Read appointments (US-04)

**Goal**: one range endpoint feeding the month marks, the day panel, and today's agenda.

- [X] T-28 [US-04] [P] Create `backend\Scheduler.Api\DTOs\AppointmentResponse.cs` — `Id`, `Title`, `Notes`, `Date`, `StartTime`, `EndTime`, `CreatedAt`. **No `UserId`** — Article V
- [X] T-29 [US-04] Create `backend\Scheduler.Api\Services\IAppointmentService.cs` and `AppointmentService.cs` with `GetRangeAsync(Guid userId, DateOnly from, DateOnly to)` — `Where(a => a.UserId == userId && a.Date >= from && a.Date <= to)`, ordered by `Date` then `StartTime`, `await`ed, mapped to DTOs by hand
- [X] T-30 [US-04] Create `backend\Scheduler.Api\Controllers\AppointmentsController.cs` with `[Authorize]` on the class and a `GET` action taking `from` and `to`, passing the claim-derived `userId` as the **first argument**. Refuse `to < from` with 400
- [X] T-31 [US-04] Register `IAppointmentService` in `Program.cs` DI
- [ ] T-32 [US-04] **Prove in Swagger**: insert two appointments directly in the database, then confirm a month range returns both, a single-day range (`from == to`) returns one, an empty range returns `[]` with 200, and ordering is by date then start time

---

## Phase 4 — Write appointments (US-05, US-06, US-07)

**Goal**: the backend is finished and fully demonstrable without a browser.

- [X] T-33 [US-05] [P] Create `backend\Scheduler.Api\DTOs\AppointmentRequest.cs` — `Title` `[Required][MaxLength(200)]`, `Notes` `[MaxLength(1000)]`, `Date` (DateOnly) `[Required]`, `StartTime` and `EndTime` (TimeOnly) `[Required]`. **No user id property** — there must be nothing for a client to spoof
- [X] T-34 [US-05] Add **one** private validation method to `AppointmentService.cs` enforcing `EndTime > StartTime`, called by both create and update so the two can never drift
- [X] T-35 [US-05] Add `CreateAsync(Guid userId, AppointmentRequest req)` — assign `UserId` from the parameter and `CreatedAt` from `DateTime.UtcNow`, save, return the created DTO with its new id
- [X] T-36 [US-06] Add `UpdateAsync(Guid userId, Guid id, AppointmentRequest req)` — fetch with `FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId)`, `null` → **404**, apply the same validation, leave `CreatedAt` untouched
- [X] T-37 [US-07] Add `DeleteAsync(Guid userId, Guid id)` — same owner-scoped fetch, `null` → **404**, then `Remove` and save. A real row delete; no soft-delete column exists
- [X] T-38 [US-05] Add the `POST` (201), `PUT` (200) and `DELETE` (204) actions to `AppointmentsController.cs`, each thin and each passing the claim-derived `userId` first
- [ ] T-39 [US-05] **Prove in Swagger**: create succeeds and returns an id; empty title → 400; title over 200 chars → 400; notes over 1000 → 400; end time equal to start → 400; `09:07:00` is accepted; a planted `userId` in the body changes nothing
- [ ] T-40 [US-06] **Prove in Swagger**: edit a field; change the date and confirm the old day's range no longer returns it and the new day's does; confirm `CreatedAt` is unchanged
- [ ] T-41 [US-07] **Prove in Swagger**: delete returns 204 and the appointment leaves the range; a second delete returns 404; confirm in the database the row is **gone**, not flagged
- [ ] T-42 [US-03] **Prove ownership in Swagger with two accounts**: as A, `GET` never returns B's appointments; `PUT` and `DELETE` on B's id both return **404, not 403**; every appointment endpoint without a token returns 401

> ### ✅ CHECKPOINT — the backend is complete and demonstrable in Swagger alone.
> If it is past mid-afternoon here, **drop Phases 9 and 10 now** and spend the remaining time on
> the frontend. A backend nobody can see is not a demo.

---

## Phase 5 — Frontend auth (US-09) · **Never cut**

- [ ] T-43 [US-09] Scaffold the app: `npm create vite@latest scheduler-app -- --template react-ts` inside `frontend\`, then `npm install` in `frontend\scheduler-app`
- [ ] T-44 [US-09] Install and configure Tailwind CSS in `frontend\scheduler-app`, wiring the directives into `src\index.css`
- [ ] T-45 [US-09] Run `npx shadcn@latest init`, then add exactly: `button`, `input`, `textarea`, `label`, `card`, `dialog`, `alert-dialog`, `calendar`. No other component library — Article VII
- [ ] T-46 [US-09] [P] Create `frontend\scheduler-app\src\lib\types.ts` mirroring the contracts: `AuthResponse`, `AppointmentResponse`, `AppointmentRequest`
- [ ] T-47 [US-09] Create `frontend\scheduler-app\src\lib\api.ts` — one `fetch` wrapper that prefixes the API base URL, attaches `Authorization: Bearer`, throws a typed error carrying the server's message, and **on 401 clears the session and redirects to `/login`** (this is how an expired 8-hour token becomes a return to sign-in, FR-006)
- [ ] T-48 [US-09] Create `frontend\scheduler-app\src\context\AuthContext.tsx` — holds `{ token, email, signIn, signUp, signOut }`, hydrates from `localStorage` on mount. **React Context only**, no state library
- [ ] T-49 [US-09] Create `frontend\scheduler-app\src\components\ProtectedRoute.tsx` and wire `react-router-dom` in `src\App.tsx`: `/login` and `/register` open; `/` and `/calendar` guarded
- [ ] T-50 [US-09] [P] Create `frontend\scheduler-app\src\pages\Login.tsx` and `Register.tsx` using shadcn `card`, `input`, `label`, `button`, showing the server's refusal inline on the form
- [ ] T-51 [US-09] **Prove in the browser**: register → land; reload → still signed in; sign out → back to `/login`; type `/calendar` while signed out → bounced to `/login`; wrong password → inline generic message

---

## Phase 6 — Month calendar and day panel (US-10)

- [ ] T-52 [US-10] Create `frontend\scheduler-app\src\pages\CalendarPage.tsx` rendering shadcn's `Calendar`. **Do not hand-build a month grid and do not add an events-calendar library** — Article VII
- [ ] T-53 [US-10] Fetch the displayed month's range on mount and on month change, and build a `Set` of `yyyy-MM-dd` strings from the result
- [ ] T-54 [US-10] Mark busy days using react-day-picker's `modifiers` / `modifiersClassNames` driven by that set
- [ ] T-55 [US-10] [P] Create `frontend\scheduler-app\src\components\AppointmentList.tsx` — renders a day's appointments sorted by start time showing title and both times, and a plain "nothing scheduled" message when empty
- [ ] T-56 [US-10] Wire day selection to the panel, defaulting the selected day to today, and add the nav control between `/` and `/calendar`
- [ ] T-57 [US-10] **Prove in the browser**: marked days match the data exactly; clicking a marked day lists it in time order; an empty day shows the message; month navigation re-marks; a second account sees only its own marks

---

## Phase 7 — Create an appointment (US-11)

- [ ] T-58 [US-11] Create `frontend\scheduler-app\src\components\AppointmentForm.tsx` inside a shadcn `dialog` — title, notes, date, start time, end time, with the date pre-filled from the selected day. Take an **optional** appointment prop now, so US-12 reuses this component instead of building a second form
- [ ] T-59 [US-11] **The time-format gotcha**: `<input type="time">` yields `"09:00"`, which will **not** bind to a `TimeOnly` and returns a 400 that looks like nothing is wrong. Add a helper in `frontend\scheduler-app\src\lib\api.ts` that appends `":00"` on the way out and trims the seconds on the way in. Do this **before** the first create attempt, not after debugging one
- [ ] T-60 [US-11] Wire submit to `POST /api/appointments`, then refetch the month so the new appointment appears in the day's list and its day becomes marked, **without a page reload**
- [ ] T-61 [US-11] Surface server refusals on the form — the server's message wins whenever it disagrees with the client-side check
- [ ] T-62 [US-11] **Prove in the browser**: add to an empty day → appears and the day becomes marked; empty title → message; end ≤ start → message; `09:07` accepted; empty notes fine

---

## Phase 8 — Edit and delete (US-12)

- [ ] T-63 [US-12] Add edit mode to `AppointmentForm.tsx` — pre-filled from the passed appointment, submitting to `PUT`. One form, two modes
- [ ] T-64 [US-12] Add edit and delete controls to `AppointmentList.tsx`, with delete opening a shadcn `alert-dialog` for confirmation. **No undo, no restore** — clarification Q3
- [ ] T-65 [US-12] Refresh the month after edit or delete so both affected days' marks update, including removing the mark from a day that lost its last appointment
- [ ] T-66 [US-12] **Prove in the browser**: edit title and times; move to another date and watch both marks change; cancel a delete → nothing happens; confirm a delete → gone and the mark clears

> ### ✅ CHECKPOINT — this is a complete scheduler and the sensible place to stop.
> Everything below is additive. Neither remaining phase is depended on by anything above.

---

## Phase 9 — Today's agenda screen (US-13) · **DROP #2**

**If dropped**: change the post-sign-in redirect to `/calendar`, which already opens with today
selected. One route deleted, one redirect target changed. Nothing in Phase 6 is touched.

- [ ] T-67 [US-13] Create `frontend\scheduler-app\src\pages\Agenda.tsx` — fetch today as a single-day range, render with the existing `AppointmentList`, and say plainly when nothing is scheduled
- [ ] T-68 [US-13] Point `/` at the agenda and make both sign-in and sign-up land there
- [ ] T-69 [US-13] **Prove in the browser**: sign in → today's appointments only, in time order; an empty today shows the message; nav reaches the calendar and back

---

## Phase 10 — Email today's schedule (US-08 + US-14) · **DROP #1**

**If dropped**: do not write them. Nothing depends on either, and dropping only one leaves a
button with no endpoint — worse than neither. Drop the pair together.

- [ ] T-70 [US-08] Create `backend\Scheduler.Api\Services\IEmailSender.cs` and `SmtpEmailSender.cs` using `System.Net.Mail.SmtpClient` driven entirely by `IOptions<SmtpOptions>`. Supply credentials **only when `UserName` is non-empty** — that single conditional is what makes MailDev and Gmail both work against unchanged code
- [ ] T-71 [US-08] Register `IEmailSender` in `Program.cs` DI
- [ ] T-72 [US-08] [P] Create `backend\Scheduler.Api\DTOs\EmailResultResponse.cs` — `Sent` (bool) and `Message` (string)
- [ ] T-73 [US-08] Add `EmailTodayAsync(Guid userId)` to `AppointmentService.cs` — today is `DateOnly.FromDateTime(DateTime.Now)` (local, per the spec); build **plain text** with subject `Your schedule for <long date>` and one line per appointment `09:30–10:15  Title`, notes indented beneath; an empty day still sends, saying so
- [ ] T-74 [US-08] Add `POST /api/appointments/email-today` to `AppointmentsController.cs` — no body, `[Authorize]`, recipient read from the **account**, never the request. Return `sent: false` with a message on SMTP failure rather than a 500
- [ ] T-75 [US-08] **Prove with MailDev**: the message appears at <http://localhost:1080> with the right subject and ordering; the empty-day case arrives too; stopping `maildev` produces `sent: false` and leaves all appointments untouched
- [ ] T-76 [US-14] Add the button to `frontend\scheduler-app\src\pages\Agenda.tsx` (or `CalendarPage.tsx` if US-13 was dropped), **disabled while the request is in flight** so a double-click cannot send two emails, showing success or failure inline
- [ ] T-77 [US-14] **Prove in the browser**: one press → one message in MailDev; a rapid double-click → still one; MailDev stopped → failure message, list unchanged; idle with the page open → zero messages

---

## Phase 11 — Verification (project Phases 8 and 9)

- [ ] T-78 [VERIFY] **Write** the manual test checklist to `specs\001-scheduler\checklists\manual-test.md`, one checkbox per acceptance criterion of every story that was actually built, grouped by story and marked with the Swagger or browser step that proves it. Skip the stories that were dropped
- [ ] T-79 [VERIFY] Walk that checklist end to end in a clean browser profile, recording each result. No automated test project — Article IX
- [ ] T-80 [VERIFY] Audit the delivered code against all nine constitution articles, reporting every violation found: banned folders or patterns, entities crossing a controller, any client-supplied user id, any non-`async` DB call, `appsettings.Development.json` in git, any non-shadcn UI component, any background job

---

## Dependencies

```text
Phase 0 setup ─→ Phase 1 data layer ─→ Phase 2 auth backend (US-01,02,03)
                                              │
                                              ├─→ Phase 3 read (US-04)
                                              │        ├─→ Phase 4 write (US-05,06,07)  ← backend complete
                                              │        │
                                              │        └─────────┐
                                              └─→ Phase 5 frontend auth (US-09)
                                                       ├─→ Phase 6 calendar (US-10) ← needs US-04
                                                       │        └─→ Phase 7 create (US-11) ← needs US-05
                                                       │                 └─→ Phase 8 edit/delete (US-12) ← needs US-06,07
                                                       ├─→ Phase 9 agenda (US-13)   ← needs US-04 only
                                                       └─→ Phase 10 email (US-08 + US-14)
```

Phases 9 and 10 hang off the trunk and carry no dependants. That is what makes them safe to cut.

## Parallel opportunities

| Where | Tasks | Why they are safe together |
|---|---|---|
| Phase 1 | T-11, T-12 | Two separate model files |
| Phase 2 | T-16, T-17, T-18 | Three separate DTO files |
| Phase 5 | T-46 with T-50 | Types file and page files never touch each other |
| Phase 10 | T-72 alongside T-70 | DTO is independent of the sender |

Everything else is genuinely sequential — a service needs its DTO, a controller needs its
service, a proof needs the thing it proves.

## Task count per story

| Story | Tasks | | Story | Tasks |
|---|---|---|---|---|
| Setup / foundational | 15 | | US-09 | 9 |
| US-01 | 6 | | US-10 | 6 |
| US-02 | 4 | | US-11 | 5 |
| US-03 | 4 | | US-12 | 4 |
| US-04 | 5 | | US-13 | 3 |
| US-05 | 6 | | US-14 | 2 |
| US-06 | 2 | | US-08 | 6 |
| US-07 | 2 | | Verification | 2 |

## MVP scope

**Phases 0–2** (T-01 to T-27) is the smallest thing that is real: accounts exist, passwords are
safe, and strangers are refused. It demos only in Swagger.

**Phases 0–6** (T-01 to T-57) is the smallest thing worth showing a person: sign in, see your
month, click a day.

**Phases 0–8** (T-01 to T-66) is the product.
