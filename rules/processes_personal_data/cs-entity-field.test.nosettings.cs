// lexcode-expect: 2
// A mail account whose file maps no sending setting is not shown to be a store's sending mailbox,
// so its address stays personal data (#13215).
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Demo.Accounts;

[Table("EmailAccounts")]
public class EmailAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string? DisplayName { get; set; }
}

[Index(nameof(Email))]
public class SmtpAccount
{
    public string Email { get; set; } = "";
}
