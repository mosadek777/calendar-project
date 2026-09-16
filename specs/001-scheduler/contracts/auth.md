# Contract: Authentication

**Controller**: `Controllers\AuthController.cs` · **Service**: `IAuthService`
**Both endpoints are OPEN** — no `[Authorize]`. A person with no token has no other way in.

---

## `POST /api/auth/register` — US-01

Create an account and sign in immediately.

**Request** — `RegisterRequest`

```json
{ "email": "someone@example.com", "password": "correct-horse" }
```

| Field | Type | Annotations |
|---|---|---|
| `email` | string | `[Required]`, `[EmailAddress]`, `[MaxLength(256)]` |
| `password` | string | `[Required]`, `[MinLength(8)]` |

**201 Created** — `AuthResponse`

```json
{ "token": "eyJhbGciOiJIUzI1NiIs...", "email": "someone@example.com" }
```

**Responses**

| Code | When |
|---|---|
| 201 | Account created; body carries an 8-hour token |
| 400 | Malformed email, or password under 8 characters |
| 409 | Email already registered — `detail`: "That email is already registered." |

**Service behaviour**

1. Lower-case the email; look for an existing user. Found → 409, nothing written.
2. `PasswordHasher<User>.HashPassword(user, password)` → store the hash. The plain password is
   never stored, returned, or logged (FR-004).
3. Insert, `await SaveChangesAsync()`, issue a token via `ITokenService`, return it.

---

## `POST /api/auth/login` — US-02

**Request** — `LoginRequest`

```json
{ "email": "someone@example.com", "password": "correct-horse" }
```

| Field | Type | Annotations |
|---|---|---|
| `email` | string | `[Required]`, `[EmailAddress]` |
| `password` | string | `[Required]` |

> `[MinLength(8)]` is deliberately **not** applied here. Length is a registration rule; applying
> it at login would let the error message reveal that a short password was never valid.

**200 OK** — `AuthResponse`, same shape as register.

**Responses**

| Code | When |
|---|---|
| 200 | Credentials correct |
| 400 | Missing field or malformed email |
| 401 | Wrong password **or** unknown email — identical body either way |

**The 401 body is byte-identical in both cases:**

```json
{ "title": "Sign-in failed", "status": 401, "detail": "Email or password is incorrect." }
```

That identity is the requirement (FR-005, US-02 AC-4): a different message or status for an
unknown email would turn this endpoint into a way to discover which addresses are registered.

**Service behaviour**

1. Look up by lower-cased email. Not found → return the generic failure. **Do not return
   early with a different shape.**
2. `VerifyHashedPassword(user, user.PasswordHash, password)`. `Failed` → the same generic
   failure. Hashes are never compared with `==` — the salt is random, so equal passwords
   produce different hashes.
3. Success → issue the token.

---

## The token — `ITokenService`

| Claim | Value |
|---|---|
| `sub` / `ClaimTypes.NameIdentifier` | The user's `Id` — **the only source of identity for every other endpoint** |
| `email` | The user's email, used for the schedule email's recipient |
| `exp` | Issued time + 8 hours (clarification Q1) |
| `iss`, `aud` | From `JwtOptions` |

Signed **HS256** with `Jwt:Key` from `appsettings.Development.json`, which is gitignored
(Article VI). The key must be at least 32 bytes or HS256 will refuse it at startup.

Validation in `Program.cs` sets `ValidateIssuer`, `ValidateAudience`, `ValidateLifetime`, and
`ValidateIssuerSigningKey` all **true**, with `ClockSkew = TimeSpan.Zero` so that an 8-hour
token expires at 8 hours rather than the default 8 hours and 5 minutes.

**Never in any response**: `PasswordHash`, the signing key, or the `User` entity itself
(Article V).
