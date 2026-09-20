using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Scheduler.Api.Data;
using Scheduler.Api.DTOs;
using Scheduler.Api.Models;

namespace Scheduler.Api.Services;

public class AppointmentService : IAppointmentService
{
    private readonly SchedulerDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(
        SchedulerDbContext db,
        IEmailSender email,
        ILogger<AppointmentService> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public async Task<AppointmentListResult> GetRangeAsync(Guid userId, DateOnly from, DateOnly to)
    {
        if (to < from)
        {
            return new AppointmentListResult(AppointmentStatus.InvalidRange, Array.Empty<AppointmentResponse>());
        }

        // The userId filter is not optional and not conditional. It is what makes
        // another person's appointments unreachable (FR-028).
        var appointments = await _db.Appointments
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.Date >= from && a.Date <= to)
            .OrderBy(a => a.Date)
            .ThenBy(a => a.StartTime)
            .ToListAsync();

        return new AppointmentListResult(
            AppointmentStatus.Success,
            appointments.Select(ToResponse).ToList());
    }

    public async Task<AppointmentResult> CreateAsync(Guid userId, AppointmentRequest request)
    {
        if (!HasValidTimes(request))
        {
            return new AppointmentResult(AppointmentStatus.InvalidTimes, null);
        }

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            UserId = userId,              // from the token, never from the request
            Title = request.Title.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            CreatedAt = DateTime.UtcNow
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync();

        return new AppointmentResult(AppointmentStatus.Success, ToResponse(appointment));
    }

    public async Task<AppointmentResult> UpdateAsync(Guid userId, Guid id, AppointmentRequest request)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (appointment is null)
        {
            return new AppointmentResult(AppointmentStatus.NotFound, null);
        }

        // Same rule as create, from the same method, so the two can never drift.
        if (!HasValidTimes(request))
        {
            return new AppointmentResult(AppointmentStatus.InvalidTimes, null);
        }

        appointment.Title = request.Title.Trim();
        appointment.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        appointment.Date = request.Date;          // changing this moves it to another day
        appointment.StartTime = request.StartTime;
        appointment.EndTime = request.EndTime;
        // CreatedAt is deliberately untouched.

        await _db.SaveChangesAsync();

        return new AppointmentResult(AppointmentStatus.Success, ToResponse(appointment));
    }

    public async Task<AppointmentStatus> DeleteAsync(Guid userId, Guid id)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (appointment is null)
        {
            return AppointmentStatus.NotFound;
        }

        // A real row delete. There is no soft-delete column to set (Article IX).
        _db.Appointments.Remove(appointment);
        await _db.SaveChangesAsync();

        return AppointmentStatus.Success;
    }

    public async Task<EmailResultResponse> EmailTodayAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return new EmailResultResponse(false, "We could not find your account.");
        }

        // Local, not UTC: the spec fixes all dates and times to the machine's own
        // clock and puts timezones out of scope.
        var today = DateOnly.FromDateTime(DateTime.Now);

        var appointments = await _db.Appointments
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.Date == today)
            .OrderBy(a => a.StartTime)
            .ToListAsync();

        var subject = $"Your schedule for {today.ToDateTime(TimeOnly.MinValue).ToString("dddd, d MMMM yyyy", CultureInfo.CurrentCulture)}";
        var body = BuildPlainTextBody(today, appointments);

        try
        {
            // The recipient comes from the account, never from the request.
            await _email.SendAsync(user.Email, subject, body);
            return new EmailResultResponse(true, $"Today's schedule was sent to {user.Email}.");
        }
        catch (Exception ex)
        {
            // A send failure changes no appointment data, and is not a 500 — the
            // request was valid and nothing broke.
            _logger.LogWarning(ex, "Sending today's schedule failed.");
            return new EmailResultResponse(false, "The email could not be sent. Your appointments are unchanged.");
        }
    }

    /// <summary>
    /// Plain text only — one line per appointment, notes indented beneath. No HTML,
    /// no attachment, no calendar invitation (clarification Q5).
    /// </summary>
    private static string BuildPlainTextBody(DateOnly day, IReadOnlyList<Appointment> appointments)
    {
        var builder = new StringBuilder();
        builder.AppendLine(day.ToDateTime(TimeOnly.MinValue).ToString("dddd, d MMMM yyyy", CultureInfo.CurrentCulture));
        builder.AppendLine();

        if (appointments.Count == 0)
        {
            builder.AppendLine("Nothing scheduled today.");
            return builder.ToString();
        }

        foreach (var appointment in appointments)
        {
            builder.AppendLine($"{appointment.StartTime:HH\\:mm}–{appointment.EndTime:HH\\:mm}  {appointment.Title}");

            if (!string.IsNullOrWhiteSpace(appointment.Notes))
            {
                builder.AppendLine($"    {appointment.Notes}");
            }
        }

        return builder.ToString();
    }

    private static bool HasValidTimes(AppointmentRequest request) => request.EndTime > request.StartTime;

    private static AppointmentResponse ToResponse(Appointment a) => new(
        a.Id,
        a.Title,
        a.Notes,
        a.Date,
        a.StartTime,
        a.EndTime,
        a.CreatedAt);
}
