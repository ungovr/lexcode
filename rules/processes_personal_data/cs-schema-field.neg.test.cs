// lexcode-expect: 0
// Schema code that stores nothing about a person: columns that are not personal, personal columns
// being dropped or left unmapped, an anonymous object built from an imported sheet's row, a blank
// import template's header row (WithColumn outside FluentMigrator), and the app's own
// MigrationBuilder (a build-step script, not EF Core), which shares the library's short name.

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
