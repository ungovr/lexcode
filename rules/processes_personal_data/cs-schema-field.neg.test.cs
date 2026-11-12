// lexcode-expect: 0
// Schema code that stores nothing about a person: columns that are not personal, personal columns
// being dropped or left unmapped, and the app's own MigrationBuilder (a build-step script, not EF
// Core), which shares the library's short name.

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

// The app's own builder of the same short name, writing a release manifest.
public class MigrationBuilder
{
    public MigrationBuilder AddColumn<T>(string name, string table) => this;
}

public class ReleaseScript
{
    public void Write(MigrationBuilder manifest)
    {
        manifest.AddColumn<string>(name: "Email", table: "maintainers");
    }
}

public class Product
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Email { get; set; } = "";
}
