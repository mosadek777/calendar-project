# Implementation Plan: Appointment Scheduler

**Branch**: `main` (feature directory `001-scheduler`) | **Date**: 2026-09-16 | **Spec**:
[spec.md](./spec.md)

**Input**: [spec.md](./spec.md), [clarifications.md](./clarifications.md),
[stories](../../stories/README.md), [constitution](../../.specify/memory/constitution.md)

> **Deviation from the plan template, on purpose.** The template emits `research.md` and
> `quickstart.md`. Article III of the constitution fixes this folder's contents as `spec.md`,
> `clarifications.md`, `plan.md`, `data-model.md`, `contracts\`, `tasks.md`. The constitution
> wins: research findings live in **Decisions** below, and the run guide lives in **How to
> run** below. Two fewer files to keep in sync on a day where that matters.

---

## Summary

A single-user appointment scheduler. An ASP.NET Core Web API issues JWTs, stores users and
appointments in SQL Server LocalDB through EF Core, and exposes six endpoints behind
`[Authorize]`. A React + Vite + TypeScript frontend holds the token in a React Context, renders
the month with shadcn/ui's `Calendar`, and sends today's schedule to MailDev on demand.

The build order is the cut line: auth backend proven in Swagger → appointments backend proven
in Swagger → React. Nothing below the line you reach at the end of the day gets built, and what
exists still works.

---

## Technical Context

**Language/Version**: C# on **.NET 9** (`net9.0`); TypeScript 5 on Node 20+

> Corrected during Phase 7. This plan originally said .NET 8 (LTS), but the machine has only
> SDKs 9.0.318 and 10.0.401 and no `Microsoft.AspNetCore.App 8.x` runtime. `net9.0` was chosen
> over `net10.0` because Swashbuckle — which every Swagger proof task depends on — is solidly
> supported there.

**Primary Dependencies**:
- Backend: `Microsoft.AspNetCore.Authentication.JwtBearer`,
  `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Design`,
  `Microsoft.Extensions.Identity.Core` (for `PasswordHasher<T>` only — **not** the full Identity
  system), `Swashbuckle.AspNetCore`
- Frontend: `react`, `react-dom`, `react-router-dom`, `tailwindcss`, shadcn/ui components,
  `react-day-picker` + `date-fns` (both arrive with shadcn's `Calendar`)

**Storage**: SQL Server LocalDB, schema created and evolved by EF Core migrations

**Testing**: Manual only — Swagger for the backend, the browser for the frontend, MailDev's web
UI for email. No test project (Article IX).

**Target Platform**: Windows 11, local development only. Never deployed.

**Project Type**: Web application — separate backend and frontend projects

**Performance Goals**: None beyond SC-008: every action returns a visible result within 2
seconds for a single local user.

**Constraints**: Must be finished today. Scope discipline outranks completeness (Article I).

**Scale/Scope**: One developer, two or three test accounts, a few dozen appointments. 6
endpoints, 4 screens, 2 entities.

**Unknowns**: None. The five that existed were resolved in
[clarifications.md](./clarifications.md).

---

## Constitution Check

*GATE: passed before design, re-checked after.*

| Article | Gate | Status |
|---|---|---|
| I — Ship today | Is anything here optional work? | **PASS** — cut line stated below in implementation terms; nothing planned that is not in a story |
| II — Documents before code | Does this phase write code? | **PASS** — this phase produces three documents and nothing else |
| III — Fixed layout | Does every planned file live in an allowed folder? | **PASS** — tree below; nothing in the repo root |
| IV — Boring architecture | Any banned pattern? | **PASS** — no CQRS, MediatR, Repository, UoW, AutoMapper, microservices. Controllers call one service method. |
| V — DTO boundary | Do entities cross a controller? | **PASS** — every contract below names a DTO; `User` and `Appointment` never appear in a signature |
| VI — Identity and ownership | Is the user id ever client-supplied? | **PASS** — read from the `sub` claim, passed into every service call; see the note under **Ownership** |
| VII — Frontend discipline | Any banned library? | **PASS** — shadcn/ui + Tailwind only; Context for auth; shadcn `Calendar` for the month |
| VIII — Email | Is anything scheduled? | **PASS** — one endpoint, called by one button; `IEmailSender` with an SMTP implementation; Gmail switch documented below |
| IX — Scope fence | Does anything out of scope appear? | **PASS** — no reset, verification, refresh tokens, roles, recurrence, week/day views, timezones, overlap checks, jobs, tests, Docker, deployment, pagination, soft delete |

**Post-design re-check: PASS.** No violation surfaced during design, so
**Complexity Tracking is empty and omitted** — there is nothing to justify.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-scheduler/
├── spec.md              # Phase 2
├── clarifications.md    # Phase 3
├── plan.md              # This file — Phase 5
├── data-model.md        # Phase 5
├── contracts/           # Phase 5
│   ├── README.md
│   ├── auth.md
│   └── appointments.md
└── tasks.md             # Phase 6 — NOT created here
```

### Source code

```text
backend/Scheduler.Api/
├── Controllers/
│   ├── AuthController.cs            # register, login
│   └── AppointmentsController.cs    # range, create, update, delete, email-day
├── Services/
│   ├── IAuthService.cs / AuthService.cs
│   ├── IAppointmentService.cs / AppointmentService.cs
│   ├── IEmailSender.cs / SmtpEmailSender.cs
│   └── ITokenService.cs / TokenService.cs
├── Data/
│   ├── SchedulerDbContext.cs
│   └── Migrations/                  # EF Core generated
├── Models/
│   ├── User.cs
│   └── Appointment.cs
├── DTOs/
│   ├── RegisterRequest.cs / LoginRequest.cs / AuthResponse.cs
│   ├── AppointmentRequest.cs / AppointmentResponse.cs
│   ├── EmailResultResponse.cs
│   └── JwtOptions.cs / SmtpOptions.cs      # config binding, no subfolder
├── Program.cs
├── appsettings.json                  # committed, no secrets
└── appsettings.Development.json      # GITIGNORED — key, connection string, SMTP

frontend/scheduler-app/
├── src/
│   ├── components/ui/               # shadcn-generated, do not hand-edit
│   ├── components/                  # AppointmentForm, AppointmentList, ProtectedRoute, Nav
│   ├── context/AuthContext.tsx
│   ├── lib/api.ts                   # fetch wrapper: attaches bearer, handles 401
│   ├── lib/types.ts                 # mirrors the contracts
│   ├── pages/                       # Login, Register, Agenda, CalendarPage
│   ├── App.tsx / main.tsx / index.css
└── (vite, tailwind, tsconfig, components.json)
```

**Structure Decision**: Two projects, exactly as Article III mandates. `Program.cs` and
`appsettings*.json` sit at the root of `Scheduler.Api` because the framework requires it —
these are not a new top-level folder. `Data/Migrations/` is EF Core's own output inside an
allowed folder.

---

## Teaching — concepts new to this project

Five things here you have not met. Each gets the space it needs; React anchors where one
honestly exists.

### 1. Password hashing with `PasswordHasher<T>`

A password must never be stored in a form anyone can read back — not by you, not by someone who
steals the database file. `PasswordHasher<TUser>` (from `Microsoft.Extensions.Identity.Core`)
does two things: `HashPassword(user, plain)` returns a single string that packs the algorithm,
a random salt, an iteration count, and the hash together; `VerifyHashedPassword(user, stored,
supplied)` re-derives and compares in constant time, returning a `PasswordVerificationResult`
enum. Because the salt is random, hashing "hunter2" twice gives two different strings — so you
can never compare hashes with `==`, only ask `VerifyHashedPassword`.
**No React anchor exists, and that is the point**: hashing is server-only. If any part of this
ever runs in the browser, it is wrong.

### 2. JWT issuance

When sign-in succeeds, the server mints a JSON Web Token: a payload of **claims** (key/value
facts — here the user's id and email), plus an expiry, signed with a secret key only the server
knows. `JwtSecurityTokenHandler` (or `JsonWebTokenHandler`) assembles it and returns one string
like `eyJhbGc...`. Nothing is stored server-side — there is no session table, no revocation
list. The signature is the whole security model: anyone can *read* a JWT (it is base64, not
encryption), but only someone with the key can *forge* one.
**React anchor**: it is like a signed cookie, except your code holds it explicitly and attaches
it to each request, rather than the browser doing it invisibly.

### 3. JWT validation, `[Authorize]`, and claims

On the way in, the JWT bearer middleware pulls the token out of the `Authorization: Bearer ...`
header, recomputes the signature with the same key, and checks issuer, audience, and expiry. If
all of that passes it builds a `ClaimsPrincipal` and hangs it on `HttpContext.User`; if any of
it fails the request is answered 401 **before your controller method runs**. `[Authorize]` on a
controller or action is what demands that check. Inside the action, `User.FindFirstValue(...)`
reads a claim back out — that is how the server learns who is calling.
**React anchor**: `[Authorize]` is your `<ProtectedRoute>` wrapper and `User` is the value from
`useAuth()` — except this one runs on the server, on every request, and a client cannot skip it
by editing its own state.

### 4. Open endpoint versus protected endpoint

An open endpoint has no `[Authorize]`: anyone who can reach the URL can call it. Register and
login must be open — a person with no token has no other way in. A protected endpoint carries
`[Authorize]`, so an anonymous or expired request never reaches your code, and inside it
`User` is guaranteed populated. Every appointment endpoint in this project is protected. The
practical difference when you are debugging: a 401 from Swagger means the token never made it
or has expired, and your breakpoint inside the controller will never be hit.
**React anchor**: exactly the public-route / guarded-route split you already build in the
router, enforced a second time where it actually counts.

### 5. Configuration and the options pattern

`appsettings.json` is a layered configuration source: the base file loads, then
`appsettings.{Environment}.json` loads on top and overrides matching keys. Rather than reading
strings all over the codebase, you bind a section to a typed class once —
`builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"))` — and then
inject `IOptions<JwtOptions>` into any service, reading `options.Value.Key`. The class is
ordinary; the binder matches properties to keys by name. This is the mechanism that makes the
MailDev → Gmail switch a config-only change.
**React anchor**: `import.meta.env` in Vite, but typed, layered by environment, and injected
rather than imported.

### Refreshers — one line each, you met these yesterday

- **DI**: register a service against its interface in `Program.cs`; anything that asks for the
  interface in its constructor gets the implementation.
- **`DbContext`**: your session with the database — `DbSet<T>` properties are the tables, and
  it already *is* a unit of work, which is why Article IV bans wrapping it.
- **Migrations**: `dotnet ef migrations add X` writes a C# diff of your model; `database update`
  applies it.
- **DTOs**: request/response shapes that are not your entities, so the wire format and the table
  can move independently — and `PasswordHash` can never leak.
- **Data annotations**: `[Required]`, `[MaxLength]`, `[EmailAddress]` on DTO properties; ASP.NET
  Core checks them and returns 400 before your action runs.
- **`async`/`await`**: every EF Core call is `await ...Async(...)`; the thread is released while
  SQL works.

---

## Decisions

Research outcomes, with what was rejected and why.

### D1 — One range endpoint serves three screens

`GET /api/appointments?from=&to=` feeds the month marks, the day panel, and today's agenda.
**Rejected**: separate `/month`, `/day`, `/today` endpoints — tidier, three times the controller
and service code, identical behaviour.

### D2 — The user id is read in the controller and passed to the service

The controller reads `sub` from `User` and passes a `Guid userId` as the first argument to every
service method. **Rejected**: `IHttpContextAccessor` injected into services — one more
registration, and it hides where identity came from. Article VI requires the id to come from
the token and never from the client; a claim read in the controller and passed explicitly
satisfies that and makes ownership visible in every service signature. Client-supplied ids are
not bound at all — no request DTO has a user id property, so there is nothing to ignore.

### D3 — `System.Net.Mail.SmtpClient`, not MailKit

Zero extra packages, and it speaks plain SMTP to MailDev on port 1025 and STARTTLS to Gmail on
587. Microsoft marks this type "not recommended for new development"; for a one-day local
project that warning costs nothing. **Rejected**: MailKit — the better library, one more package
and one more API to learn today. If SmtpClient misbehaves against Gmail later, swapping it
touches only `SmtpEmailSender.cs`, which is the point of the interface.

### D4 — `DateOnly` and `TimeOnly`

`Date` is a `DateOnly`, `StartTime`/`EndTime` are `TimeOnly`. EF Core 8 maps these to SQL
Server `date` and `time` natively, and `System.Text.Json` serializes them as `"2026-09-16"` and
`"09:00:00"`. **Rejected**: `DateTime` everywhere — invites exactly the timezone confusion
Article IX puts out of scope.
**Gotcha to expect**: the browser's `<input type="time">` yields `"09:00"`, which will not parse
as a `TimeOnly` on the server. The frontend appends `":00"` before sending. This is written into
US-11's tasks so it is not discovered at 5pm.

### D5 — Token in `localStorage`

The `AuthContext` reads it once on mount and writes it on sign-in. **Rejected**: an httpOnly
cookie — better against XSS, but it needs CORS credentials, a cookie policy, and antiforgery
consideration. Not today, for a local app that is never deployed.

### D7 — Swashbuckle pinned to 7.2.0, Microsoft.OpenApi pinned to 1.6.22

Both pins were forced during Phase 7 and both are about Swagger, not the API.

- **Swashbuckle 7.2.0, not 10.x.** `dotnet add package` resolved 10.2.3, which ships
  OpenAPI.NET v2: `OpenApiInfo` and friends left `Microsoft.OpenApi.Models` and the security
  scheme reference API changed shape, breaking the build. 7.2.0 builds clean against the
  familiar v1 API. **Rejected**: rewriting the Swagger configuration against the v2 API today.
- **Microsoft.OpenApi 1.6.22, not 1.6.30.** 1.6.23+ writes `"openapi": "3.0.4"`, a patch
  version the Swagger UI bundled with 7.2.0 does not recognise — the document is valid and all
  paths generate correctly, but the UI refuses to render it. 1.6.22 writes `"openapi":
  "3.0.1"`. Verified by serializing a probe document under each version rather than by
  guessing.
- **`Microsoft.AspNetCore.OpenApi` removed.** It is .NET 9's built-in OpenAPI generator, left
  over from the project template and never called — no `AddOpenApi`, no `MapOpenApi`. It was
  the only thing requiring `Microsoft.OpenApi >= 1.6.30`, so deleting the unused package is
  what allows the pin.

### D6 — No global error/toast system

Errors render inline where they happen: on the form, or in the panel. **Rejected**: a toast
provider — one more component and a provider to thread through, for messages that have a
natural home on screen.

---

## Backend design

### Services and their registrations

| Interface | Implementation | Lifetime | Responsibility |
|---|---|---|---|
| `ITokenService` | `TokenService` | Singleton | Build a JWT from a user; nothing else |
| `IAuthService` | `AuthService` | Scoped | Register, verify credentials, hash passwords |
| `IAppointmentService` | `AppointmentService` | Scoped | All appointment reads/writes, all ownership checks, all validation beyond annotations |
| `IEmailSender` | `SmtpEmailSender` | Scoped | Send one plain-text message; knows nothing about appointments |

`AppointmentService` composes `IEmailSender` for the email-day operation: it builds the
message text from today's appointments and hands the finished subject and body to the sender.
The sender stays ignorant of the domain, which is what makes it swappable.

### Ownership — how Article VI is actually enforced

1. Every appointment action carries `[Authorize]`, so an anonymous request dies in middleware.
2. The controller reads the id from the token: `User.FindFirstValue("sub")` — the same literal
   name `TokenService` writes, with both claim-type maps cleared so nothing renames it in
   transit.
3. Every `IAppointmentService` method takes `Guid userId` as its **first parameter**.
4. Every query is filtered by it: `.Where(a => a.UserId == userId)`. A single-item fetch is
   `FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId)`.
5. A miss returns **404, never 403** — a 403 would confirm that someone else's appointment
   exists.
6. No request DTO has a user id property, so a client cannot supply one even by accident.

### Validation, in two layers

- **Data annotations on DTOs** — `[Required]`, `[MaxLength(200)]`, `[MaxLength(1000)]`,
  `[EmailAddress]`, `[MinLength(8)]`. ASP.NET Core returns a 400 `ValidationProblemDetails`
  before the action body runs.
- **Service checks** — the rules annotations cannot express: end time strictly after start time,
  duplicate email on register, range `to` not before `from`. These return a result the
  controller turns into 400 or 409.

FR-016 is satisfied because both layers live on the server; the React form's checks are a
convenience and are never trusted.

---

## Email: MailDev now, Gmail by configuration

MailDev is a local SMTP server that accepts every message and shows it in a web UI at
<http://localhost:1080> instead of delivering it. Nothing leaves the machine.

`SmtpEmailSender` reads `IOptions<SmtpOptions>` and does nothing provider-specific — no
`if (host == "localhost")`, no branching. **The switch to Gmail is a config-only change, per
Article VIII**:

`appsettings.Development.json` (gitignored) — development:

```json
{
  "Smtp": {
    "Host": "localhost",
    "Port": 1025,
    "EnableSsl": false,
    "UserName": "",
    "Password": "",
    "FromAddress": "scheduler@localhost",
    "FromName": "Appointment Scheduler"
  }
}
```

The same file, switched to Gmail — **only these values change, no code is touched**:

| Setting | MailDev | Gmail |
|---|---|---|
| `Host` | `localhost` | `smtp.gmail.com` |
| `Port` | `1025` | `587` |
| `EnableSsl` | `false` | `true` (STARTTLS) |
| `UserName` | empty | your full Gmail address |
| `Password` | empty | a Google **App Password**, not your account password |
| `FromAddress` | `scheduler@localhost` | the same Gmail address |

`SmtpEmailSender` supplies credentials only when `UserName` is non-empty, which is the one
conditional the class needs and the only reason both configurations work unchanged.

**MailDev is already installed and running** on this machine (`npm install -g maildev`), so
Phase 7's first task is to *verify* it rather than install it — see **How to run**.

---

## Frontend design

**Routes** (`react-router-dom`): `/login`, `/register` open; `/` (agenda) and `/calendar`
wrapped in `<ProtectedRoute>`. Sign-in and sign-up both navigate to `/`.

**`AuthContext`** holds `{ token, email, signIn, signUp, signOut }`, hydrating from
`localStorage` on mount. No state library, per Article VII.

**`lib/api.ts`** is one `fetch` wrapper: prefixes the base URL, attaches
`Authorization: Bearer`, parses JSON, throws a typed error carrying the server's message, and
on **401 clears the session and redirects to `/login`** — which is how an expired 8-hour token
becomes a return to sign-in (FR-006) rather than a broken screen.

**shadcn components to add** — exactly these, nothing else:
`button`, `input`, `textarea`, `label`, `card`, `dialog`, `alert-dialog`, `calendar`, `sonner`
is **not** added (see D6).

**The month calendar** uses shadcn's `Calendar` with react-day-picker's `modifiers` /
`modifiersClassNames` to mark days that have appointments — a `Set` of `yyyy-MM-dd` strings
built from the month's range query. Hand-building a grid, or adding an events-calendar library,
is banned by Article VII.

**One form, two modes**: `AppointmentForm` takes an optional appointment. Absent → create,
present → edit. One set of fields, one set of client-side checks, two callers.

---

## The cut line, in implementation terms

Build in this order. **Whatever is unfinished when the day ends is dropped, and what exists
still works.** This is the operational form of Article I.

| Step | Stories | Deliverable | If you stop here |
|---|---|---|---|
| 0 | — | MailDev reachable, solution + projects created, LocalDB reachable | Nothing works yet |
| 1 | US-01, US-02, US-03 | Auth backend, **proven in Swagger** | Register and login return tokens; protected endpoints 401 correctly |
| 2 | US-04 | Range query, proven in Swagger | Data can be read back, isolated per user |
| 3 | US-05, US-06, US-07 | Create/update/delete, proven in Swagger | **The whole backend is done and demonstrable in Swagger alone** |
| 4 | US-09 | Auth screens, context, guard | You can sign in in a browser |
| 5 | US-10 | Calendar screen with marks and day panel | **First real demo.** Sign in → see your month |
| 6 | US-11 | Create form | A usable scheduler |
| 7 | US-12 | Edit + delete | **A complete scheduler. The sensible place to stop.** |
| 8 | US-13 | Agenda landing screen | Today's list on landing |
| 9 | US-08 + US-14 | Email endpoint + button | The full feature set |

### What was actually dropped

**US-13, the agenda screen, was cut.** Decided after step 7, with the scheduler complete.
Not because time ran out — because the screen turned out to be redundant: the calendar opens
with today selected and today's appointments already in its day panel. The post-sign-in
redirect had been pointed at `/calendar` after step 5 for exactly that reason, and building
the agenda would have reversed a decision that proved correct in use.

FR-021 and FR-022 are knowingly unmet; the P5 band in `spec.md` is marked conditional for this
case. Nothing needed removing, because nothing had been built. **US-08 and US-14, the email
pair, were kept** — the reverse of the order below, which is fine: the drop order says which
to cut *first when forced*, not which is least valuable.

### The drop order as originally planned, and what each cut costs

1. **US-08 + US-14 (email) — dropped first, together.** A button with no endpoint is worse than
   neither. Nothing depends on either. Cost: the person reads today's schedule on screen
   instead of in their inbox. **Removal is: do not write them.** Nothing else changes.
2. **US-13 (agenda screen) — dropped second, alone.** Sign-in redirects to `/calendar` instead
   of `/`, and the calendar already opens with today selected. Cost: one screen, no
   information. **Removal is: one route deleted and one redirect target changed.** This is
   precisely what clarification Q4's two-screen split bought.
3. **Below that, do not cut — restructure the day instead.** Cutting US-12 leaves a scheduler
   you cannot correct; cutting US-11 leaves a viewer; cutting US-10 leaves nothing to look at.

**If step 3 is not finished by mid-afternoon**, the correct move is to drop 8 and 9 immediately
and spend the time on the frontend, because a backend nobody can see is not a demo.

---

## How to run

You run every server; I never start or stop one (Article III, Environment).

**MailDev** is already installed globally (`npm install -g maildev`) and running. Phase 7's
first task only confirms it is listening — SMTP on 1025, web UI on <http://localhost:1080>:

```powershell
Test-NetConnection -ComputerName localhost -Port 1025
Start-Process "http://localhost:1080"
```

**Three terminals:**

```powershell
# 1 — mail catcher, UI at http://localhost:1080 (already running)
maildev

# 2 — API, Swagger at https://localhost:7xxx/swagger
cd C:\Users\moham\OneDrive\Desktop\calendar-project\backend\Scheduler.Api
dotnet run

# 3 — frontend, at http://localhost:5173
cd C:\Users\moham\OneDrive\Desktop\calendar-project\frontend\scheduler-app
npm run dev
```

**Database** (run once after the first migration is written):

```powershell
cd C:\Users\moham\OneDrive\Desktop\calendar-project\backend\Scheduler.Api
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `<input type="time">` sends `"09:00"`, `TimeOnly` rejects it | High | D4 — the frontend appends `":00"`; written into the US-11 tasks |
| CORS blocks the Vite origin | High | Add a named CORS policy for `http://localhost:5173` in `Program.cs` during step 1, not when it first bites |
| shadcn init fights the Tailwind version | Medium | Scaffold the frontend at step 4 with the versions shadcn's current init expects; do not upgrade anything |
| LocalDB instance not running | Medium | `sqllocaldb start MSSQLLocalDB` before the first `database update` |
| Mail catcher unreachable | Low | MailDev is installed and running; step 0 only verifies port 1025. If it is down, restart `maildev` rather than debugging the sender |
| Time runs out | **Certain to matter** | The cut line above, applied without renegotiation |
