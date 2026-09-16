# Data Model: Appointment Scheduler

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-09-16

Two entities. Both live in `backend\Scheduler.Api\Models\`. Neither ever crosses a controller
boundary — the wire shapes are in [contracts/](./contracts/README.md), per Article V.

---

## Entity: `User`

| Property | .NET type | SQL Server | Constraints | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | `uniqueidentifier` | PK | Generated in code on register |
| `Email` | `string` | `nvarchar(256)` | Required, **unique index**, max 256 | Stored lower-cased; also the address schedule emails go to |
| `PasswordHash` | `string` | `nvarchar(max)` | Required | Output of `PasswordHasher<User>.HashPassword`. **Never** serialized, logged, or returned |
| `CreatedAt` | `DateTime` | `datetime2` | Required | `DateTime.UtcNow` at registration |

**Navigation**: `ICollection<Appointment> Appointments`

**Rules**

- Email uniqueness is enforced by a **unique index**, not only by a service check. The service
  check gives the friendly 409; the index is what makes a duplicate impossible if two requests
  race.
- Email is compared case-insensitively by lower-casing on write and on lookup — simpler than a
  collation change.
- `PasswordHash` has no maximum length in the model because the hasher's format may change
  length between algorithm versions.

**Out of scope on this entity** (Article IX): no email-verified flag, no password-reset token,
no roles, no refresh token, no last-login, no soft-delete column.

---

## Entity: `Appointment`

| Property | .NET type | SQL Server | Constraints | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | `uniqueidentifier` | PK | Generated in code on create |
| `UserId` | `Guid` | `uniqueidentifier` | Required, FK → `User.Id`, **indexed** | Set from the token's claim. Never bound from a request |
| `Title` | `string` | `nvarchar(200)` | Required, 1–200 | FR-014 |
| `Notes` | `string?` | `nvarchar(1000)` | Optional, max 1000 | FR-014. `null` when omitted |
| `Date` | `DateOnly` | `date` | Required | The calendar day. No time component, no timezone |
| `StartTime` | `TimeOnly` | `time` | Required | Any minute (FR-015a) |
| `EndTime` | `TimeOnly` | `time` | Required, **strictly greater than `StartTime`** | FR-015 |
| `CreatedAt` | `DateTime` | `datetime2` | Required | Set on create, never changed by an edit |

**Navigation**: `User User`

**Rules**

- `EndTime > StartTime`, enforced in `AppointmentService` for both create and update — one
  method used by both, so the two can never drift.
- Start and end are `TimeOnly` on a single `Date`, which makes crossing midnight
  **structurally impossible** rather than something to validate.
- Deleting is a real row delete (`Remove` + `SaveChangesAsync`). Soft delete is banned by
  Article IX and undo was ruled out in clarification Q3.
- Two appointments may overlap freely. There is no uniqueness constraint on
  `(UserId, Date, StartTime)` — overlap detection is out of scope.
- `CreatedAt` survives an update, proven by US-06 acceptance criterion 6.

---

## Relationship

```text
User 1 ──────< Appointment
      Id          UserId  (required FK, indexed, cascade delete)
```

- One user has many appointments; every appointment has exactly one user.
- **Cascade delete** on the FK. No screen deletes a user, so this never fires in practice — it
  exists so the schema cannot hold an orphan.
- The FK is **required**, so an ownerless appointment cannot be stored.

---

## Indexes

| Table | Index | Why |
|---|---|---|
| `Users` | unique on `Email` | Makes duplicate registration impossible even under a race |
| `Appointments` | on `UserId` | Every single query filters by it |
| `Appointments` | on `(UserId, Date)` | The range query — the hottest read in the app — filters on exactly this pair |

No other index. At this data volume they would be decoration.

---

## `SchedulerDbContext`

Lives in `backend\Scheduler.Api\Data\`. Holds `DbSet<User> Users` and
`DbSet<Appointment> Appointments`, and configures the constraints above in
`OnModelCreating`. Registered in DI with `AddDbContext<SchedulerDbContext>` against the
LocalDB connection string from configuration.

No repository, no unit-of-work wrapper — `DbContext` already is both (Article IV).

---

## Query shapes the services will use

| Story | Shape |
|---|---|
| US-04 range | `Where(a => a.UserId == userId && a.Date >= from && a.Date <= to).OrderBy(a => a.Date).ThenBy(a => a.StartTime)` |
| US-06 / US-07 single | `FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId)` → `null` becomes **404**, never 403 |
| US-08 today | the range shape with `from == to == DateOnly.FromDateTime(DateTime.Now)` |

`DateTime.Now`, not `UtcNow`, for "today" — the spec fixes all dates and times to the machine's
local values and puts timezones out of scope. `CreatedAt` remains UTC because it is a
bookkeeping stamp nobody displays.

Every one of these is `await`ed. No synchronous EF Core call exists anywhere (Article IV).

---

## State transitions

An appointment has no status field and no lifecycle. It is created, optionally edited any
number of times, and eventually deleted. There is nothing to model — noted explicitly so the
absence reads as a decision rather than an omission.

---

## Migrations

One migration, `InitialCreate`, producing both tables, the unique email index, the two
appointment indexes, and the FK. Further migrations only if the model changes — and a model
change to these fields requires a constitution amendment (Technology & Configuration
Constraints).
