using Scheduler.Api.Models;

namespace Scheduler.Api.Services;

public interface ITokenService
{
    /// <summary>Builds a signed JWT carrying the user's id in the "sub" claim.</summary>
    string CreateToken(User user);
}
