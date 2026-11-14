// lexcode-expect: 0
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Identity;
using Microsoft.Identity.Web;
using Stripe;

namespace MyShop.Accounts;

// Sign-in with a password and social or workforce sign-in that only links an account do not count,
// nor does a payment with the same vendor, nor the app's own email-verification session service.
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

public class Login(SignInManager<IdentityUser> signIn, PaymentIntentService payments)
{
    public async Task RunAsync(string email, string password)
    {
        await signIn.PasswordSignInAsync(email, password, isPersistent: false, lockoutOnFailure: true);
        await payments.CreateAsync(new PaymentIntentCreateOptions { Amount = 1000, Currency = "usd" });
        var sessions = new VerificationSessionService();
        sessions.Create(email);
        var scan = new DocScanClient("receipts");
    }
}

public class VerificationSessionService
{
    public string Create(string email) => $"sent a link to {email}";
}

public class DocScanClient(string folder);
