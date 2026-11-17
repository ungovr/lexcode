// lexcode-expect: 0
// With the vendors' `using` lines: a Stripe customer and a Checkout session given test address
// literals (plain, verbatim and raw), a Sentry user with no address, and Sentry told not to send
// user data.
using Sentry;
using Stripe;
using Stripe.Checkout;

namespace Demo.Billing.Tests;

public class StripeFixtures(CustomerService customers, SessionService sessions)
{
    public Task<Customer> SeedAsync() =>
        customers.CreateAsync(new CustomerCreateOptions { Email = "test@example.com", Name = "Test" });

    public Task<Session> SeedSessionAsync() =>
        sessions.CreateAsync(new SessionCreateOptions { CustomerEmail = @"buyer@example.com" });

    public Task<Customer> SeedRawAsync()
    {
        var options = new CustomerCreateOptions();
        options.Email = """seed@example.com""";
        return customers.CreateAsync(options);
    }
}

public class ErrorTagging
{
    public void Tag(string accountId) =>
        SentrySdk.ConfigureScope(scope => scope.User = new SentryUser { Id = accountId });

    public static void Configure(WebApplicationBuilder builder) =>
        builder.WebHost.UseSentry(o =>
        {
            o.Dsn = "https://key@o0.ingest.sentry.io/0";
            o.SendDefaultPii = false;
        });
}
