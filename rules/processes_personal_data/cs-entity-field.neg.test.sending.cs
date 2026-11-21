// lexcode-expect: 0
// A store's sending mail account: the mailbox and SMTP login the app sends its own mail from,
// mapped with its sending settings and tied to no person. Its address, display name and login are
// the operator's, not a person's (#13215): a class named for the account, and a class mapped to a
// table named for it.
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Demo.Mail;

[Table("EmailAccounts")]
public class EmailAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string? DisplayName { get; set; }
    public string Host { get; set; } = "";
    public int Port { get; set; }
    public bool EnableSsl { get; set; }
    public string Username { get; set; } = "";
}

[Index(nameof(Email))]
public class SmtpAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string SmtpServer { get; set; } = "";
}

[Table("smtp_accounts")]
public class OutboundMailbox
{
    public int Id { get; set; }
    public string EmailAddress { get; set; } = "";
}
