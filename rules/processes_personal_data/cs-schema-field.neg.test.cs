// lexcode-expect: 0
// Schema code that stores nothing about a person: columns that are not personal, personal columns
// being dropped or left unmapped, an anonymous object built from an imported sheet's row, a blank
// import template's header row (WithColumn outside FluentMigrator), the app's own
// MigrationBuilder (a build-step script, not EF Core), which shares the library's short name, and
// the columns of a sending mail account (EmailAccount, MailAccount, SmtpAccount): the mailbox and
// SMTP login the app sends its own mail from, which are not a person's data (#13215).

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Demo.Build;

public partial class DropFax : Microsoft.EntityFrameworkCore.Migrations.Migration
{
    protected override void Up(Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Products",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false),
                Title = table.Column<string>(type: "text", nullable: false)
            });
        // Removing a personal column stores nothing.
        migrationBuilder.DropColumn(name: "Email", table: "Customers");
        migrationBuilder.AddColumn<long>(name: "PriceCents", table: "Products");
    }
}

public class ProductConfiguration : Microsoft.EntityFrameworkCore.IEntityTypeConfiguration<Product>
{
    public void Configure(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<Product> builder)
    {
        builder.Property(p => p.Title).HasMaxLength(100);
        // An ignored property is not mapped to a column.
        builder.Ignore(p => p.Email);
    }
}

public class DropSubscriberEmail : FluentMigrator.Migration
{
    public override void Up()
    {
        Create.Table("Product").WithColumn("Title").AsString(400);
        Delete.Column("Email").FromTable("Subscriber");
    }

    public override void Down()
    {
    }
}

// A blank import template: a header row and no data, outside any FluentMigrator migration.
public class SheetTemplate
{
    public SheetTemplate WithColumn(string header) => this;
}

public class SignupImportTemplate
{
    public SheetTemplate Build() => new SheetTemplate().WithColumn("Email").WithColumn("PhoneNumber");
}

// The app's own builder of the same short name, writing a release manifest.
public class MigrationBuilder
{
    public MigrationBuilder AddColumn<T>(string name, string table) => this;

    public MigrationBuilder CreateTable(string name, Func<ManifestRow, object> columns) => this;
}

public class ManifestRow
{
    public T Column<T>(string name) => default!;
}

public class ReleaseScript
{
    public void Write(MigrationBuilder manifest)
    {
        manifest.AddColumn<string>(name: "Email", table: "maintainers");
        manifest.CreateTable("maintainers", t => new { Email = t.Column<string>("email") });
    }

    // A row read from an imported sheet: an anonymous object built from another library's row,
    // not a column declared in a database. (Nothing here is stored.)
    public object Preview(ManifestRow row) => new { Email = row.Column<string>("email"), Title = row.Column<string>("title") };
}

public class Product
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Email { get; set; } = "";
}

// nopCommerce's shape: an entity builder given FluentMigrator's table builder maps the store's
// sending mailbox by nameof.
public class EmailAccountBuilder
{
    public void MapEntity(FluentMigrator.Builders.Create.Table.CreateTableExpressionBuilder table)
    {
        table
            .WithColumn(nameof(EmailAccount.DisplayName)).AsString(255).Nullable()
            .WithColumn(nameof(EmailAccount.Email)).AsString(255).NotNullable()
            .WithColumn(nameof(Nop.Core.Domain.Messages.EmailAccount.Email)).AsString(255).NotNullable()
            .WithColumn(nameof(EmailAccount.Username)).AsString(255).NotNullable();
    }
}

public class AddSmtpAccounts : FluentMigrator.Migration
{
    public override void Up()
    {
        Create.Table("SmtpAccount")
            .WithColumn("Id").AsInt32().PrimaryKey()
            .WithColumn("Email").AsString(255).NotNullable()
            .WithColumn("Username").AsString(255).NotNullable();
        Alter.Table(nameof(EmailAccount)).AddColumn(nameof(EmailAccount.Email)).AsString(255).Nullable();
        Alter.Table("mail_accounts").AddColumn("email_address").AsString(255).Nullable();
    }

    public override void Down()
    {
    }
}

public partial class AddEmailAccounts : Microsoft.EntityFrameworkCore.Migrations.Migration
{
    protected override void Up(Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "EmailAccounts",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false),
                Email = table.Column<string>(type: "text", nullable: false),
                DisplayName = table.Column<string>(type: "text", nullable: true)
            });
        migrationBuilder.CreateTable("smtp_accounts", table => new { email = table.Column<string>(nullable: false) });
        migrationBuilder.AddColumn<string>(name: "Email", table: "MailAccounts", nullable: true);
        migrationBuilder.AddColumn<string>("Email", "EmailAccount");
    }
}

public class EmailAccountConfiguration : Microsoft.EntityFrameworkCore.IEntityTypeConfiguration<EmailAccount>
{
    public void Configure(EntityTypeBuilder<EmailAccount> builder)
    {
        builder.Property(a => a.Email).HasMaxLength(255).IsRequired();
        builder.HasIndex(a => a.Email).IsUnique();
    }
}

public class MailDb : Microsoft.EntityFrameworkCore.DbContext
{
    protected override void OnModelCreating(Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SmtpAccount>().Property(a => a.Email).HasMaxLength(255);
        modelBuilder.Entity<EmailAccount>(entity => entity.HasIndex(a => a.Email).IsUnique());
    }
}

public class EmailAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string? DisplayName { get; set; }
    public string Username { get; set; } = "";
}

public class SmtpAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
}
