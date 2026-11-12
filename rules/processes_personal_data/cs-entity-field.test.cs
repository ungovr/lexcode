// lexcode-expect: 8
// Persistent classes whose stored members hold an email address, a phone number, a date of
// birth, a government identifier or an IP address: classes mapped with Table, an EF Core Index
// or Owned, and members mapped one at a time with Column or a MongoDB BsonElement.
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson.Serialization.Attributes;
using Schema = System.ComponentModel.DataAnnotations.Schema;

namespace Demo.Data;

[Table("customers")]
public class Customer
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public DateOnly DateOfBirth { get; init; }
    public string DisplayName { get; set; } = "";
}

[Schema.Table("logins")]
public class LoginEvent
{
    public long Id { get; set; }
    public string IpAddress;
}

[Index(nameof(EmailAddress), IsUnique = true)]
public class Subscriber
{
    public int Id { get; set; }
    public required string EmailAddress { get; init; }
}

[Owned]
public class ContactDetails
{
    public string? MobileNumber { get; set; }
}

public class Order
{
    public int Id { get; set; }

    [Column("billing_email")]
    public string BillingEmail { get; set; } = "";

    [Column("total_cents")]
    public long TotalCents { get; set; }
}

public class Member
{
    [BsonId]
    public string Id { get; set; } = "";

    [BsonElement("ssn")]
    public string Ssn { get; set; } = "";
}
