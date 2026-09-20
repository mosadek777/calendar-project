using Scheduler.Api.DTOs;

namespace Scheduler.Api.Services;

public enum AuthStatus
{
    Success,
    EmailInUse,
    InvalidCredentials
}

/// <summary>
/// What the service tells the controller. Not a wire DTO — the controller maps
/// the status onto a status code.
/// </summary>
public record AuthResult(AuthStatus Status, AuthResponse? Response);

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<AuthResult> LoginAsync(LoginRequest request);
}
