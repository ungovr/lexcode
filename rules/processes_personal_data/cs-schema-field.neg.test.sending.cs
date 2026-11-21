// lexcode-expect: 0
// A store's sending mail account: the mailbox and SMTP login the app sends its own mail from
// (nopCommerce's EmailAccount), mapped with its sending settings and tied to no person. Its
// address, display name and login are the operator's, not a person's (#13215). Every form the
// rule reads a column in: a FluentMigrator entity builder and migration, an EF Core migration, an
// EF Core configuration class and a DbContext's model builder.
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Demo.Mail;

public class EmailAccountBuilder
{
    public void MapEntity(FluentMigrator.Builders.Create.Table.CreateTableExpressionBuilder table)
    {
        table
            .WithColumn(nameof(EmailAccount.DisplayName)).AsString(255).Nullable()
            .WithColumn(nameof(EmailAccount.Email)).AsString(255).NotNullable()
            .WithColumn(nameof(Nop.Core.Domain.Messages.EmailAccount.Email)).AsString(255).NotNullable()
            .WithColumn(nameof(EmailAccount.Host)).AsString(255).NotNullable()
            .WithColumn(nameof(EmailAccount.Port)).AsInt32()
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
            .WithColumn("SmtpServer").AsString(255).NotNullable();
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
                Host = table.Column<string>(type: "text", nullable: false),
                EnableSsl = table.Column<bool>(nullable: false)
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
        builder.Property(a => a.UseDefaultCredentials);
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
    public string Host { get; set; } = "";
    public int Port { get; set; }
    public bool EnableSsl { get; set; }
    public bool UseDefaultCredentials { get; set; }
    public string Username { get; set; } = "";
}

public class SmtpAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string SmtpServer { get; set; } = "";
}
