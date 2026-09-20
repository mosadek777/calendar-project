using Microsoft.EntityFrameworkCore;
using Scheduler.Api.Models;

namespace Scheduler.Api.Data;

/// <summary>
/// The session with the database. DbContext is already a unit of work and a
/// repository, which is why nothing wraps it (Article IV).
/// </summary>
public class SchedulerDbContext : DbContext
{
    public SchedulerDbContext(DbContextOptions<SchedulerDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.CreatedAt).IsRequired();

            // Makes a duplicate registration impossible even if two requests race.
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Title).IsRequired().HasMaxLength(200);
            entity.Property(a => a.Notes).HasMaxLength(1000);
            entity.Property(a => a.Date).IsRequired();
            entity.Property(a => a.StartTime).IsRequired();
            entity.Property(a => a.EndTime).IsRequired();
            entity.Property(a => a.CreatedAt).IsRequired();

            entity.HasOne(a => a.User)
                  .WithMany(u => u.Appointments)
                  .HasForeignKey(a => a.UserId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => a.UserId);

            // The range query — the hottest read in the app — filters on exactly this pair.
            entity.HasIndex(a => new { a.UserId, a.Date });
        });

        base.OnModelCreating(modelBuilder);
    }
}
