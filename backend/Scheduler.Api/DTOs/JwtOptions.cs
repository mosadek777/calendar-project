namespace Scheduler.Api.DTOs;

/// <summary>
/// Bound from the "Jwt" configuration section. Key lives only in
/// appsettings.Development.json, which is gitignored.
/// </summary>
public class JwtOptions
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public int LifetimeMinutes { get; set; } = 480;
}
