// lexcode-expect: 11
// Services that hand a person's email address, or a hash of it, to an outside vendor: a Stripe
// customer created and updated (inline, target-typed and set on a local) and a Checkout session,
// a user set on Sentry's scope two ways and Sentry told to send user data (set in a lambda and in
// an initializer), a Mailchimp list member, and a Gravatar address.
using MailChimp.Net.Models;
using Sentry;
using Stripe;
using Stripe.Checkout;

namespace Demo.Billing;

public class BillingService(CustomerService customers, SessionService sessions)
{
    public Task<Customer> CreateAsync(AppUser user) =>
        customers.CreateAsync(new CustomerCreateOptions { Email = user.Email, Name = user.DisplayName });

    public Task<Customer> CreateTargetTypedAsync(AppUser user)
    {
        CustomerCreateOptions options = new() { Name = user.DisplayName, Email = user.Email };
        return customers.CreateAsync(options);
    }

    public Task<Customer> CreateStepwiseAsync(AppUser user)
    {
        var options = new CustomerCreateOptions();
        options.Email = user.Email;
        return customers.CreateAsync(options);
    }

    public Task<Customer> ChangeEmailAsync(string customerId, string newEmail) =>
        customers.UpdateAsync(customerId, new CustomerUpdateOptions { Email = newEmail });

    public Task<Session> CheckoutAsync(AppUser user) =>
        sessions.CreateAsync(new SessionCreateOptions { Mode = "subscription", CustomerEmail = user.Email });
}

public class ErrorTagging
{
    public void Tag(AppUser user)
    {
        SentrySdk.ConfigureScope(scope => scope.User = new SentryUser { Id = user.Id, Email = user.Email });
        SentrySdk.ConfigureScope(scope =>
        {
            scope.User.Email = user.Email;
        });
    }

    public static void Configure(WebApplicationBuilder builder) =>
        builder.WebHost.UseSentry(o =>
        {
            o.Dsn = "https://key@o0.ingest.sentry.io/0";
            o.SendDefaultPii = true;
        });

    public static IDisposable Start() =>
        SentrySdk.Init(new SentryOptions { Dsn = "https://key@o0.ingest.sentry.io/0", SendDefaultPii = true });
}

public class Newsletter
{
    public Member ToMember(AppUser user) =>
        new Member { EmailAddress = user.Email, StatusIfNew = Status.Subscribed };

    public string Avatar(string emailHash) => $"https://www.gravatar.com/avatar/{emailHash}?s=80&d=identicon";
}

public class AppUser
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";
    public string DisplayName { get; set; } = "";
}
