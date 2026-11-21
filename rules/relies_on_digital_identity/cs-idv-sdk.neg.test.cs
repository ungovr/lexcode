// lexcode-expect: 0
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Identity;
using Microsoft.Identity.Web;
using Stripe;

namespace MyShop.Accounts;

// Sign-in with a password and social or workforce sign-in that only links an account do not count,
// nor does a payment with the same vendor (also through a StripeClient's service held in a local),
// nor the app's own email-verification session service.
public static class AuthSetup
{
    public static void Configure(IServiceCollection services, IConfiguration config)
    {
        services.AddAuthentication()
            .AddGoogle(o => { o.ClientId = config["Google:ClientId"]!; })
            .AddMicrosoftAccount(o => { o.ClientId = config["Microsoft:ClientId"]!; })
            .AddOpenIdConnect("oidc", o => { o.Authority = "https://login.example.com"; });
        services.AddMicrosoftIdentityWebAppAuthentication(config);
    }
}

public class Login(SignInManager<IdentityUser> signIn, PaymentIntentService payments, StripeClient stripe)
{
    public async Task RunAsync(string email, string password)
    {
        await signIn.PasswordSignInAsync(email, password, isPersistent: false, lockoutOnFailure: true);
        await payments.CreateAsync(new PaymentIntentCreateOptions { Amount = 1000, Currency = "usd" });
        var sessions = new VerificationSessionService();
        sessions.Create(email);
        var scan = new DocScanClient("receipts");
        var intents = stripe.V1.PaymentIntents;
        await intents.CreateAsync(new PaymentIntentCreateOptions { Amount = 500, Currency = "eur" });
    }

    // An identity service held in a local beside a payments one: only a call on the identity
    // local is a verification, and this block makes none.
    public async Task ChargeAsync(StripeClient stripe)
    {
        var sessions = stripe.V1.Identity.VerificationSessions;
        var reports = stripe.V1.Identity.VerificationReports;
        var intents = stripe.V1.PaymentIntents;
        await intents.CreateAsync(new PaymentIntentCreateOptions { Amount = 500, Currency = "eur" });
        await intents.GetAsync("pi_1");
    }
}

public class VerificationSessionService
{
    public string Create(string email) => $"sent a link to {email}";
}

public class DocScanClient(string folder);
