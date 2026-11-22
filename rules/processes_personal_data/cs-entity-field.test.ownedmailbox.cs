// lexcode-expect: 2
// A mailbox a person connects in a mail client: a MailAccount with its sending settings and the
// user it belongs to, by class name and by table name. Its address is that person's, so it stays
// personal data (#13215).
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo.MailClient;

[Table("MailAccounts")]
public class MailAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = "";
    public string SmtpHost { get; set; } = "";
    public string ImapHost { get; set; } = "";
}

[Table("email_accounts")]
public class ConnectedInbox
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string EmailAddress { get; set; } = "";
}
