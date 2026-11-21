// lexcode-expect: 4
// A mail account whose file maps no sending setting is not shown to be a store's sending mailbox,
// so its address stays personal data (#13215).
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Demo.Accounts;

public class EmailAccountBuilder
{
    public void MapEntity(FluentMigrator.Builders.Create.Table.CreateTableExpressionBuilder table)
    {
        table
            .WithColumn(nameof(EmailAccount.Email)).AsString(255).NotNullable()
            .WithColumn(nameof(EmailAccount.DisplayName)).AsString(255).Nullable();
    }
}

public partial class AddEmailAccounts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "EmailAccounts",
            columns: table => new { Email = table.Column<string>(nullable: false), DisplayName = table.Column<string>(nullable: true) });
    }
}

public class EmailAccountConfiguration : IEntityTypeConfiguration<EmailAccount>
{
    public void Configure(EntityTypeBuilder<EmailAccount> builder)
    {
        builder.Property(a => a.Email).HasMaxLength(255);
        builder.HasIndex(a => a.Email).IsUnique();
    }
}

public class EmailAccount
{
    public string Email { get; set; } = "";
    public string? DisplayName { get; set; }
}
