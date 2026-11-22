// lexcode-expect: 5
// A mailbox a person connects in a mail client: a MailAccount with its sending settings and the
// user it belongs to. Its address is that person's, so it stays personal data (#13215), in a
// FluentMigrator migration, an EF Core migration and an EF Core configuration class.
using FluentMigrator.Builders.Create.Table;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Demo.MailClient;

public class AddMailAccounts : FluentMigrator.Migration
{
    public override void Up()
    {
        Create.Table("MailAccount")
            .WithColumn("Id").AsInt32().PrimaryKey()
            .WithColumn("UserId").AsInt32().ForeignKey("User", "Id")
            .WithColumn("Email").AsString(255).NotNullable()
            .WithColumn("SmtpHost").AsString(255).NotNullable()
            .WithColumn("ImapHost").AsString(255).NotNullable();
        Alter.Table(nameof(MailAccount)).AddColumn(nameof(MailAccount.Email)).AsString(255).Nullable();
    }

    public override void Down()
    {
    }
}

public partial class CreateMailAccounts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "MailAccounts",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false),
                UserId = table.Column<int>(nullable: false),
                Email = table.Column<string>(nullable: false),
                SmtpPort = table.Column<int>(nullable: false)
            });
        migrationBuilder.AddColumn<string>(name: "Email", table: "EmailAccounts", nullable: true);
    }
}

public class MailAccountConfiguration : IEntityTypeConfiguration<MailAccount>
{
    public void Configure(EntityTypeBuilder<MailAccount> builder)
    {
        builder.Property(a => a.Email).HasMaxLength(255);
        builder.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId);
    }
}

public class MailAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Email { get; set; } = "";
    public string SmtpHost { get; set; } = "";
    public string ImapHost { get; set; } = "";
}

public class User
{
    public int Id { get; set; }
}
