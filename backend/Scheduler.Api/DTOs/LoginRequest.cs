using System.ComponentModel.DataAnnotations;

namespace Scheduler.Api.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Deliberately NOT [MinLength(8)]. Length is a registration rule; enforcing it
    /// here would let the error message reveal that a short password was never valid.
    /// </summary>
    [Required]
    public string Password { get; set; } = string.Empty;
}
