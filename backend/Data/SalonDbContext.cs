using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class SalonDbContext : DbContext
{
    public SalonDbContext(DbContextOptions<SalonDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    public DbSet<Service> Services => Set<Service>();

    public DbSet<Staff> Staff => Set<Staff>();

    public DbSet<Review> Reviews => Set<Review>();

    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>().ToTable("customers");
        modelBuilder.Entity<Appointment>().ToTable("appointments");
        modelBuilder.Entity<Service>().ToTable("services");
        modelBuilder.Entity<Staff>().ToTable("staff");
        modelBuilder.Entity<Review>().ToTable("reviews");
        modelBuilder.Entity<Post>().ToTable("posts");

        modelBuilder.Entity<Post>().Property(x => x.CoverImageUrl)
            .HasColumnName("cover_image_url");
        modelBuilder.Entity<Post>().Property(x => x.IsPublished)
            .HasColumnName("is_published");
        modelBuilder.Entity<Post>().Property(x => x.PublishedAt)
            .HasColumnName("published_at");
        modelBuilder.Entity<Post>().Property(x => x.CreatedAt)
            .HasColumnName("created_at");
        modelBuilder.Entity<Post>().Property(x => x.UpdatedAt)
            .HasColumnName("updated_at");

        modelBuilder.Entity<Post>()
            .HasIndex(x => x.Slug)
            .IsUnique();

        modelBuilder.Entity<Review>().Property(x => x.AuthorName)
            .HasColumnName("author_name");

        modelBuilder.Entity<Review>().Property(x => x.GuestSince)
            .HasColumnName("guest_since");

        modelBuilder.Entity<Review>().Property(x => x.IsApproved)
            .HasColumnName("is_approved");

        modelBuilder.Entity<Review>().Property(x => x.CreatedAt)
            .HasColumnName("created_at");

        modelBuilder.Entity<Customer>().Property(x => x.FullName)
            .HasColumnName("full_name");

        modelBuilder.Entity<Customer>().Property(x => x.PhoneNumber)
            .HasColumnName("phone_number");

        // Unique only when a phone is present (walk-ins may be null).
        modelBuilder.Entity<Customer>()
            .HasIndex(x => x.PhoneNumber)
            .IsUnique()
            .HasFilter("phone_number IS NOT NULL");

        modelBuilder.Entity<Service>().Property(x => x.ServiceName)
            .HasColumnName("service_name");

        modelBuilder.Entity<Service>().Property(x => x.DurationMinutes)
            .HasColumnName("duration_minutes");

        modelBuilder.Entity<Appointment>().Property(x => x.CustomerId)
            .HasColumnName("customer_id");

        modelBuilder.Entity<Appointment>().Property(x => x.GuestName)
            .HasColumnName("guest_name");

        modelBuilder.Entity<Appointment>().Property(x => x.StaffId)
            .HasColumnName("staff_id");

        modelBuilder.Entity<Appointment>().Property(x => x.ServiceId)
            .HasColumnName("service_id");

        modelBuilder.Entity<Appointment>().Property(x => x.AppointmentDate)
            .HasColumnName("appointment_date");

        modelBuilder.Entity<Appointment>().Property(x => x.AppointmentTime)
            .HasColumnName("appointment_time");

        modelBuilder.Entity<Appointment>().Property(x => x.AmountPaid)
            .HasColumnName("amount_paid");

        modelBuilder.Entity<Appointment>().Property(x => x.PaymentMethod)
            .HasColumnName("payment_method");

        modelBuilder.Entity<Appointment>().Property(x => x.CompletedAt)
            .HasColumnName("completed_at");

        // Staff account columns + uniqueness on username (when set).
        modelBuilder.Entity<Staff>().Property(x => x.Username)
            .HasColumnName("username");
        modelBuilder.Entity<Staff>().Property(x => x.PasswordHash)
            .HasColumnName("password_hash");
        modelBuilder.Entity<Staff>().Property(x => x.PasswordSalt)
            .HasColumnName("password_salt");
        modelBuilder.Entity<Staff>().Property(x => x.RegisteredAt)
            .HasColumnName("registered_at");
        modelBuilder.Entity<Staff>().Property(x => x.Email)
            .HasColumnName("email");
        modelBuilder.Entity<Staff>().Property(x => x.PasswordResetTokenHash)
            .HasColumnName("password_reset_token_hash");
        modelBuilder.Entity<Staff>().Property(x => x.PasswordResetExpiresAt)
            .HasColumnName("password_reset_expires_at");

        modelBuilder.Entity<Staff>().Property(x => x.IsApproved)
            .HasColumnName("is_approved")
            .HasDefaultValue(false);
        modelBuilder.Entity<Staff>().Property(x => x.ApprovedAt)
            .HasColumnName("approved_at");

        modelBuilder.Entity<Staff>()
            .HasIndex(x => x.Username)
            .IsUnique()
            .HasFilter("username IS NOT NULL");

        modelBuilder.Entity<Staff>()
            .HasIndex(x => x.Email)
            .IsUnique()
            .HasFilter("email IS NOT NULL");
    }
}