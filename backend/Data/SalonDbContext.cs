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

    public DbSet<Product> Products => Set<Product>();

    public DbSet<ProductOrder> ProductOrders => Set<ProductOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>().ToTable("customers");
        modelBuilder.Entity<Appointment>().ToTable("appointments");
        modelBuilder.Entity<Service>().ToTable("services");
        modelBuilder.Entity<Staff>().ToTable("staff");
        modelBuilder.Entity<Review>().ToTable("reviews");
        modelBuilder.Entity<Post>().ToTable("posts");
        modelBuilder.Entity<Product>().ToTable("products");
        modelBuilder.Entity<ProductOrder>().ToTable("product_orders");

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
        modelBuilder.Entity<Staff>().Property(x => x.MustChangePassword)
            .HasColumnName("must_change_password")
            .HasDefaultValue(false);

        modelBuilder.Entity<Staff>().Property(x => x.IsOwner)
            .HasColumnName("is_owner")
            .HasDefaultValue(false);

        modelBuilder.Entity<Staff>()
            .HasIndex(x => x.Username)
            .IsUnique()
            .HasFilter("username IS NOT NULL");

        // Email must be unique only among active staff. A revoked account keeps
        // its email but is deactivated, so it must not block a fresh sign-up
        // that reuses the same address.
        modelBuilder.Entity<Staff>()
            .HasIndex(x => x.Email)
            .IsUnique()
            .HasFilter("email IS NOT NULL AND \"IsActive\"");

        // Products — retail catalogue.
        modelBuilder.Entity<Product>().Property(x => x.ShortDescription)
            .HasColumnName("short_description");
        modelBuilder.Entity<Product>().Property(x => x.ImageUrl)
            .HasColumnName("image_url");
        modelBuilder.Entity<Product>().Property(x => x.StockQuantity)
            .HasColumnName("stock_quantity");
        modelBuilder.Entity<Product>().Property(x => x.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);
        modelBuilder.Entity<Product>().Property(x => x.CreatedAt)
            .HasColumnName("created_at");
        modelBuilder.Entity<Product>().Property(x => x.UpdatedAt)
            .HasColumnName("updated_at");

        modelBuilder.Entity<Product>()
            .HasIndex(x => x.IsActive);

        modelBuilder.Entity<Product>()
            .HasIndex(x => x.Slug)
            .IsUnique();

        // Product orders — customer-placed retail orders.
        modelBuilder.Entity<ProductOrder>().Property(x => x.CustomerName)
            .HasColumnName("customer_name");
        modelBuilder.Entity<ProductOrder>().Property(x => x.CustomerPhone)
            .HasColumnName("customer_phone");
        modelBuilder.Entity<ProductOrder>().Property(x => x.CustomerEmail)
            .HasColumnName("customer_email");
        modelBuilder.Entity<ProductOrder>().Property(x => x.DeliveryAddress)
            .HasColumnName("delivery_address");
        modelBuilder.Entity<ProductOrder>().Property(x => x.ProductId)
            .HasColumnName("product_id");
        modelBuilder.Entity<ProductOrder>().Property(x => x.ProductName)
            .HasColumnName("product_name");
        modelBuilder.Entity<ProductOrder>().Property(x => x.UnitPrice)
            .HasColumnName("unit_price");
        modelBuilder.Entity<ProductOrder>().Property(x => x.TotalAmount)
            .HasColumnName("total_amount");
        modelBuilder.Entity<ProductOrder>().Property(x => x.CreatedAt)
            .HasColumnName("created_at");
        modelBuilder.Entity<ProductOrder>().Property(x => x.UpdatedAt)
            .HasColumnName("updated_at");

        // Set null on the order row if its product is later deleted, so historical
        // orders survive (the product_name + unit_price snapshot still tells the
        // story of what was sold).
        modelBuilder.Entity<ProductOrder>()
            .HasOne(o => o.Product)
            .WithMany()
            .HasForeignKey(o => o.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ProductOrder>()
            .HasIndex(x => x.Status);
        modelBuilder.Entity<ProductOrder>()
            .HasIndex(x => x.CreatedAt);
    }
}