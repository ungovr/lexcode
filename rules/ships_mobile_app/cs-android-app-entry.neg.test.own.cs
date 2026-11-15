// lexcode-expect: 0
// A web shop's own audit types that share Android's short names, in another namespace: an Activity
// attribute that tags a business activity and an Application class for credit applications. No
// Android build is involved.
using Contoso.Audit;

namespace Contoso.Billing;

[Activity("checkout")]
public class CheckoutActivity : Activity
{
    public string Cart { get; init; } = "";
}

[Activity("credit-review", Launcher = true)]
public class CreditApplication : Application
{
    public decimal Amount { get; init; }
}
