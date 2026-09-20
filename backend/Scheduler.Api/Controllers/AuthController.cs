using Microsoft.AspNetCore.Mvc;
using Scheduler.Api.DTOs;
using Scheduler.Api.Services;

namespace Scheduler.Api.Controllers;

/// <summary>
/// Open endpoints — no [Authorize]. A person with no token has no other way in.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _auth.RegisterAsync(request);

        return result.Status switch
        {
            AuthStatus.Success => StatusCode(StatusCodes.Status201Created, result.Response),
            AuthStatus.EmailInUse => Problem(
                title: "Email already registered",
                detail: "That email is already registered.",
                statusCode: StatusCodes.Status409Conflict),
            _ => Problem(statusCode: StatusCodes.Status400BadRequest)
        };
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);

        return result.Status == AuthStatus.Success
            ? Ok(result.Response)
            : Problem(
                title: "Sign-in failed",
                detail: "Email or password is incorrect.",
                statusCode: StatusCodes.Status401Unauthorized);
    }
}
