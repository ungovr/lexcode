// lexcode-expect: 14
// Stored columns for an email, phone number, date of birth, government identifier or IP address,
// declared in schema code: EF Core migrations, EF Core model configuration (a configuration class,
// an owned type, and a DbContext's model builder), and FluentMigrator (a migration and an
// entity builder given its table builder).
using FluentMigrator.Builders.Create.Table;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;
using Mig = Microsoft.EntityFrameworkCore.Migrations;

namespace Demo.Data.Migrations;

public partial class AddCustomers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Customers",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false),
                Email = table.Column<string>(type: "text", nullable: false),
                NormalizedEmail = table.Column<string>(type: "text", nullable: true),
                Title = table.Column<string>(type: "text", nullable: true)
            });
        migrationBuilder.AddColumn<string>(name: "PhoneNumber", table: "Customers", nullable: true);
        migrationBuilder.AddColumn<DateOnly>("DateOfBirth", "Customers");
        migrationBuilder.AddColumn<int>(name: "LoyaltyPoints", table: "Customers");
    }
}

public partial class AddLoginIp : Mig.Migration
{
    protected override void Up(Mig.MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "LastLoginIp", table: "Logins");
    }
}

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.Property(c => c.Email).HasMaxLength(256).IsRequired();
        builder.HasIndex(c => c.PassportNumber).IsUnique();
        builder.Property(c => c.Title).HasMaxLength(100);
        builder.OwnsOne(c => c.Contact, contact => contact.Property(k => k.PhoneNumber).HasMaxLength(30));
    }
}

public class ShopDb : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>().Property(c => c.TaxId).HasMaxLength(20);
        modelBuilder.Entity<Customer>(entity => entity.HasIndex(c => c.Ssn).IsUnique());
    }
}

public class CreateSubscribers : FluentMigrator.Migration
{
    public override void Up()
    {
        Create.Table("Subscriber")
            .WithColumn("Id").AsInt32().PrimaryKey()
            .WithColumn("EmailAddress").AsString(255).NotNullable()
            .WithColumn(nameof(Customer.IpAddress)).AsString(100).Nullable();
        Alter.Table("Customer").AddColumn(nameof(Customer.MobileNumber)).AsString(50).Nullable();
    }

    public override void Down()
    {
        Delete.Table("Subscriber");
    }
}

public class CustomerBuilder
{
    public void MapEntity(CreateTableExpressionBuilder table)
    {
        table
            .WithColumn(nameof(Customer.Title)).AsString(400).NotNullable()
            .WithColumn(nameof(Customer.Email)).AsString(1000).Nullable();
    }
}

public class Customer
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Email { get; set; } = "";
    public string? PassportNumber { get; set; }
    public string? TaxId { get; set; }
    public string? IpAddress { get; set; }
    public string? MobileNumber { get; set; }
    public string? Ssn { get; set; }
    public ContactDetails Contact { get; set; } = new();
}

public class ContactDetails
{
    public string? PhoneNumber { get; set; }
}
