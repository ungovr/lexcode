// lexcode-expect: 0
// No person's address sent to a vendor: the app's own CustomerCreateOptions, SentryUser and
// Member classes (same short names, no vendor `using`), a Stripe customer given a test address
// literal, Sentry told not to send user data, an app scope object's User.Email outside Sentry's
// ConfigureScope, and a Gravatar mention in a comment.
using Demo.Crm.Models;

namespace Demo.Crm;

public class CrmImport(CrmClient crm)
{
    public void Import(Contact contact)
    {
        crm.Create(new CustomerCreateOptions { Email = contact.Email, Region = "EU" });
        var member = new Member { EmailAddress = contact.Email };
        var reviewer = new SentryUser { Email = contact.Email };
        crm.Enqueue(member, reviewer);
    }

    public void Audit(AuditScope scope, Contact contact)
    {
        scope.User.Email = contact.Email;
    }

    // Avatars used to come from gravatar.com/avatar; they are now uploaded by the user.
    public string Avatar(Contact contact) => $"/avatars/{contact.Id}.png";
}

public class CustomerCreateOptions
{
    public string? Email { get; set; }
    public string? Region { get; set; }
}
