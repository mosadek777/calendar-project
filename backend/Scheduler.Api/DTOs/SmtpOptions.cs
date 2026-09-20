namespace Scheduler.Api.DTOs;

/// <summary>
/// Bound from the "Smtp" configuration section. Switching from the local mail
/// catcher to Gmail is a change to these values only — no code changes.
/// See plan.md, "Email: MailDev now, Gmail by configuration".
/// </summary>
public class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public bool EnableSsl { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "scheduler@localhost";
    public string FromName { get; set; } = "Appointment Scheduler";
}
