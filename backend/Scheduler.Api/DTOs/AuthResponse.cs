namespace Scheduler.Api.DTOs;

/// <summary>
/// Everything a client gets back from register and login. There is no field here
/// for PasswordHash, which is what makes leaking it structurally impossible.
/// </summary>
public record AuthResponse(string Token, string Email);
