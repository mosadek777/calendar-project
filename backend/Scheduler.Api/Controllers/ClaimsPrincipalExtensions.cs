using System.Security.Claims;

namespace Scheduler.Api.Controllers;

/// <summary>
/// The single place the acting user's id is read. It comes from the token and
/// nowhere else — never from a route value, query string, or request body
/// (Article VI, FR-027).
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Reads the literal "sub" claim that TokenService writes. Both claim-type maps
    /// are cleared so the name never changes in transit; reading
    /// ClaimTypes.NameIdentifier instead would return null here.
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : Guid.Empty;
    }
}
