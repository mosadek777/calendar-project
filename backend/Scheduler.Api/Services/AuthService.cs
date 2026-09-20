using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scheduler.Api.Data;
using Scheduler.Api.DTOs;
using Scheduler.Api.Models;

namespace Scheduler.Api.Services;

public class AuthService : IAuthService
{
    private readonly SchedulerDbContext _db;
    private readonly IPasswordHasher<User> _hasher;
    private readonly ITokenService _tokens;

    public AuthService(SchedulerDbContext db, IPasswordHasher<User> hasher, ITokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        var email = Normalize(request.Email);

        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            return new AuthResult(AuthStatus.EmailInUse, null);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            CreatedAt = DateTime.UtcNow
        };

        // The plain password exists only as this argument. It is never stored or logged.
        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResult(AuthStatus.Success, new AuthResponse(_tokens.CreateToken(user), user.Email));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var email = Normalize(request.Email);
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Unknown email and wrong password return the SAME result, so the response
        // cannot be used to discover which addresses are registered (FR-005).
        if (user is null)
        {
            return new AuthResult(AuthStatus.InvalidCredentials, null);
        }

        var verification = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return new AuthResult(AuthStatus.InvalidCredentials, null);
        }

        return new AuthResult(AuthStatus.Success, new AuthResponse(_tokens.CreateToken(user), user.Email));
    }

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
