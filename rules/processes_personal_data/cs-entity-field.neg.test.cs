// lexcode-expect: 0
// Personal-looking names that are not stored: a view model that is never persisted, an unmapped
// property, a static and a constant on a mapped class, a local variable, and a class marked with
// the app's own Table attribute (a report layout), which shares the library's short name.

namespace Demo.Reporting;

// Not mapped to a table: a form model bound from a request and discarded.
public class ContactFormModel
{
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
}

[System.ComponentModel.DataAnnotations.Schema.Table("products")]
public class Product
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string EmailTemplate { get; set; } = "";

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? Email { get; set; }

    public static string Phone { get; set; } = "";
    public const string Ssn = "n/a";

    public string Describe()
    {
        string email = "none";
        return Title + email;
    }
}

// The app's own attribute of the same short name, naming a printed report's table.
[AttributeUsage(AttributeTargets.Class)]
public sealed class TableAttribute(string name) : Attribute
{
    public string Name { get; } = name;
}

[Table("Monthly signups")]
public class SignupReportRow
{
    public string Email { get; set; } = "";
    public DateOnly DateOfBirth { get; set; }
}
