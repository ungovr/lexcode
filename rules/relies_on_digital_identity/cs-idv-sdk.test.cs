// lexcode-expect: 9
using Stripe;
using Stripe.Identity;
using Yoti.Auth.DocScan;
using Si = Stripe.Identity;
using Yd = Yoti.Auth.DocScan;

namespace MyShop.Kyc;

// Stripe Identity: a service injected through a primary-constructor parameter
public class IdentityCheck(VerificationSessionService sessions)
{
    public async Task<string> StartAsync(string userId)
    {
        var options = new VerificationSessionCreateOptions { Type = "document" };
        var session = await sessions.CreateAsync(options);                              // 1
        return session.ClientSecret;
    }

    public VerificationSession Status(string id) => sessions.Get(id);                    // 2
}

public class IdentityCheckLocal
{
    public void Run(StripeClient client, string id)
    {
        var sessions = new VerificationSessionService();
        sessions.Create(new VerificationSessionCreateOptions { Type = "id_number" });   // 3 using
        Si.VerificationReportService reports = new();                                   // target-typed new(), alias
        var report = reports.Get(id);                                                   // 4
        client.V1.Identity.VerificationSessions.Create(new());                          // 5 StripeClient
    }
}

// Yoti: its identity app and its document scan
public class YotiCheck
{
    public void Run(string sdkId, Stream key, string token)
    {
        var yoti = new YotiClient(sdkId, key);                                          // 6 a global using in another file
        var full = new Yoti.Auth.YotiClient(sdkId, key);                                // 7 fully qualified
        var scan = new DocScanClient(sdkId, key);                                       // 8 using
        Yd.DocScanClient aliased = new(sdkId, key);                                     // 9 target-typed new(), alias
    }
}
