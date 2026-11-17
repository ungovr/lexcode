// lexcode-expect: 5
using Stripe;
using Ya = Yoti.Auth;

namespace MyShop.Kyc;

// Stripe's verification reports through a StripeClient, and Yoti's client in its target-typed forms:
// named through an alias, and by its short name where a `global using` in another file brings it in;
// Stripe's sessions and reports held in a local before the call.
public class IdentityForms
{
    public void Run(StripeClient client, string reportId, string sdkId, Stream key)
    {
        client.V1.Identity.VerificationReports.Get(reportId);                             // 1
        Ya.YotiClient aliased = new(sdkId, key);                                          // 2
        YotiClient shared = new(sdkId, key);                                              // 3
        var sessions = client.V1.Identity.VerificationSessions;
        sessions.Create(new());                                                           // 4
        var reports = client.V1.Identity.VerificationReports;
        reports.GetAsync(reportId);                                                       // 5
    }
}
