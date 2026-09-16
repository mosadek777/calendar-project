<!--
SYNC IMPACT REPORT (scratch — for review of this amendment)
Version change: unversioned template → 1.0.0
Bump rationale: initial ratification; every template placeholder resolved.
Modified principles: n/a (initial adoption)
Added sections:
  - Core Principles: Articles I–IX
  - Technology & Configuration Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none
Deferred TODOs: none
-->

# Appointment Scheduler Constitution

## Core Principles

### I. Ship Today (NON-NEGOTIABLE)

The project MUST be delivered in a single working day. When a simpler option that ships
competes with a better option that might not, the simpler option MUST be chosen and the
trade-off MUST be stated out loud at the moment it is taken. Features MUST be built in the
declared priority order — auth, month calendar with day selection, create appointment, edit
and delete, today's agenda, manual email — and that order IS the cut line. Work MUST NOT
begin on a lower-priority feature while a higher-priority one is incomplete. Every planning
document MUST name what gets dropped first if time runs out.

### II. Documents Before Code (NON-NEGOTIABLE)

Phases 1–6 (constitution, spec, clarifications, stories and traceability, plan, tasks and
analysis) produce documents ONLY. No application source file, project file, package manifest,
or scaffold command may be created until Phase 7 is explicitly approved. Exactly ONE phase is
executed per turn, after which work STOPS and waits for approval. Design mistakes are then
corrected in Markdown, where they cost minutes, instead of in code, where they cost the day.

### III. Fixed Repository Layout

The following layout is binding, and nothing may be placed in the repository root:

- `.specify\memory\constitution.md` — this document
- `specs\001-scheduler\` — `spec.md`, `clarifications.md`, `plan.md`, `data-model.md`,
  `contracts\`, `tasks.md`
- `stories\README.md`, `stories\backend\`, `stories\frontend\`
- `backend\Scheduler.Api\` — ALL .NET code, no exceptions
- `frontend\scheduler-app\` — ALL React code, no exceptions

Inside `backend\Scheduler.Api\` the ONLY permitted folders are `Controllers\`, `Services\`,
`Data\`, `Models\`, `DTOs\`. A new top-level folder is an amendment, not a decision.

### IV. Boring Backend Architecture (NON-NEGOTIABLE)

The following are BANNED outright: microservices, CQRS, MediatR, the Repository pattern over
EF Core, Unit of Work, AutoMapper, and any abstraction layered on top of `DbContext`.
`DbContext` is already a unit of work and a repository; wrapping it adds files, not safety.
Controllers MUST stay thin — bind the model, call one service method, return a result. All
business logic MUST live in services registered in DI behind an interface (`IAuthService`,
`IAppointmentService`, `IEmailSender`, …). Every database call MUST be `async`/`await`.
Mapping between entities and DTOs MUST be written by hand.

### V. The DTO Boundary

Entity types (`User`, `Appointment`) MUST NEVER cross a controller boundary in either
direction. Every request body and every response body MUST be a purpose-built DTO in `DTOs\`.
Server-side validation is MANDATORY on every write endpoint — data annotations plus explicit
service-level checks — and client-side validation is a convenience that MUST NOT be trusted.
This rule is what makes it structurally impossible to serialize `PasswordHash` to a client.

### VI. Identity and Ownership (NON-NEGOTIABLE)

Passwords MUST be hashed with ASP.NET Core Identity's `PasswordHasher<T>` and MUST NEVER be
stored, logged, returned, or echoed in plain text. Authentication is JWT bearer tokens, and
every appointment endpoint MUST carry `[Authorize]`. The acting user's id MUST be read from
the token's claims inside the service layer and MUST NEVER be accepted from a route
parameter, query string, or request body. A user MUST be able to read or modify only their
own appointments; a request for another user's appointment MUST fail as if the record does
not exist. The JWT signing key lives ONLY in `appsettings.Development.json`, which is
gitignored.

### VII. Frontend Discipline

The UI is built from shadcn/ui components plus Tailwind utility classes. NO other component
or UI library may be added. NO state management library (Redux, Zustand, MobX, React Query)
may be added: authentication state lives in a React Context, everything else is local
component state. Day selection MUST use shadcn/ui's `Calendar` component (react-day-picker)
with a modifier marking days that have appointments; the selected day's appointments render
in a panel beside or below it. Hand-building a month grid is FORBIDDEN, and FullCalendar or
any other events-calendar library is FORBIDDEN. TypeScript is used throughout, with API
request and response shapes typed to match the contracts.

### VIII. Email by Button, Never by Scheduler

Email is sent through an `IEmailSender` interface with a single SMTP implementation. In
development it delivers to MailHog on localhost. Sending is triggered ONLY by an explicit
user action — the "Email me today's schedule" button — and NEVER by a timer, background
service, hosted service, queue, or scheduled job. Switching to Gmail SMTP MUST be a
configuration-only change (host, port, credentials, SSL flag in `appsettings`) requiring no
code edit, and `plan.md` MUST document exactly which settings change. This decision is
SETTLED and MUST NOT be re-litigated.

### IX. The Scope Fence

The following are OUT OF SCOPE and MUST NOT be built, stubbed, scaffolded, or designed for:
password reset, email verification, refresh tokens, roles or authorization policies,
recurring appointments, drag and drop, week or day views, timezone handling beyond the
browser's local time, overlap or conflict detection, notifications, scheduled or background
jobs, automated test projects, Docker, deployment, pagination, and soft delete. Any of these
appearing in a spec, plan, task, or code change is a violation and MUST be removed rather
than debated. "We might want it later" is not a reason to build it today.

## Technology & Configuration Constraints

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, shadcn/ui, react-day-picker (via the
  shadcn `Calendar` component).
- **Backend**: ASP.NET Core Web API, EF Core, SQL Server LocalDB, JWT bearer authentication,
  `PasswordHasher<User>` from ASP.NET Core Identity.
- **Domain (fixed)**: `User(Id, Email, PasswordHash, CreatedAt)`;
  `Appointment(Id, UserId, Title, Notes, Date, StartTime, EndTime, CreatedAt)`. Adding a field
  requires an amendment.
- **Configuration**: the connection string, JWT settings (key, issuer, audience, lifetime),
  and SMTP settings are bound from configuration via the options pattern. Secrets live in
  `appsettings.Development.json` ONLY; that file is gitignored and MUST NOT be committed.
- **Schema**: created and evolved with EF Core migrations. No hand-written SQL scripts.
- **Environment**: Windows 11 with PowerShell. Every command given to the developer MUST use
  PowerShell syntax and Windows paths. Bash syntax MUST NOT be used.
- **Servers**: the developer runs the API, the Vite dev server, and MailHog in their own
  terminals. The agent MUST NOT start or stop servers; it states what to run and waits.

## Development Workflow & Quality Gates

- **Phase order**: 1 constitution → 2 specify → 3 clarify → 4 stories tree and traceability
  matrix → 5 plan (plan.md, data-model.md, contracts) → 6 tasks then analyze → 7 implement.
  One phase per turn, then STOP.
- **Implementation order inside Phase 7**: MailHog availability first, then the auth backend
  proven working in Swagger, then the appointments backend proven in Swagger, then the React
  frontend. Each task is announced as `T-xx [US-yy] description` before it is executed.
- **Story numbering**: `US-01..US-0n` for backend stories, continuing into frontend stories.
  Every task MUST reference the story it serves, and every story MUST trace to a spec
  requirement in the traceability matrix.
- **Teaching**: any .NET concept new to this project — JWT issuance and validation, password
  hashing, `[Authorize]` and claims, configuration and the options pattern, and how a
  protected endpoint differs from an open one — MUST be explained in 3–6 lines before its
  first use, anchored to a React equivalent where one exists. Concepts already met (DI,
  `DbContext`, migrations, DTOs, data annotations, `async`/`await`) get a one-line refresher
  only.
- **Testing**: verification is a written manual checklist executed by the developer. No
  automated test project is created.
- **Review**: the final phase audits the delivered code against every article of this
  constitution and reports each violation found.
- **Git**: after the developer approves a phase — and only then — `git add .`, `git commit`,
  `git push`. Never before approval, never per individual task.

## Governance

This constitution supersedes all other practices, habits, and defaults for this project.
Where a tool's convention, a framework template, or a general best practice conflicts with an
article here, the article wins.

- **Amendments** require explicit developer approval, a one-line reason recorded in this
  document, and a version bump. An amendment is never implied by a code change.
- **Versioning** follows semantic versioning: MAJOR for removing or reversing an article,
  MINOR for adding an article or materially expanding one, PATCH for clarifications and
  wording.
- **Compliance** is verified at every phase gate: spec, plan, tasks, and the final review each
  check their output against these articles. A violation MUST be fixed, or explicitly waived
  by the developer in writing, before the phase is approved.
- **Complexity** carries the burden of proof. The default answer to "should we add a layer, a
  library, or an abstraction" is NO unless a named article requires it.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
