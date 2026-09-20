using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;
using Scheduler.Api.DTOs;

namespace Scheduler.Api.Services;

/// <summary>
/// Everything here comes from SmtpOptions. There is no provider-specific branching:
/// moving from the local mail catcher to Gmail is a change to appsettings only
/// (Article VIII). See plan.md, "Email: MailDev now, Gmail by configuration".
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;

    public SmtpEmailSender(IOptions<SmtpOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            UseDefaultCredentials = false
        };

        // The one conditional this class needs, and the reason both configurations
        // work unchanged: the local catcher wants no credentials, Gmail requires them.
        if (!string.IsNullOrWhiteSpace(_options.UserName))
        {
            client.Credentials = new NetworkCredential(_options.UserName, _options.Password);
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false,
            SubjectEncoding = Encoding.UTF8,
            BodyEncoding = Encoding.UTF8
        };

        message.To.Add(to);

        await client.SendMailAsync(message);
    }
}
