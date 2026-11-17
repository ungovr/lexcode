// lexcode-expect: 0
using Microsoft.Extensions.Logging;

namespace MyShop.Accounts;

// A social sign-in endpoint, a vendor's web page that is not its API, an API address only written to a
// log, an API address handed to the app's own client class named like RestSharp's (this file has no
// `using RestSharp;`), and Stripe's payments and customers API, which is not its identity API.
public class Links(HttpClient http, ILogger<Links> logger)
{
    public async Task RunAsync()
    {
        var authorize = new Uri("https://accounts.google.com/o/oauth2/v2/auth");
        var privacy = await http.GetStringAsync("https://onfido.com/privacy/");
        var pricing = new Uri("https://www.veriff.com/pricing");
        logger.LogInformation("https://api.onfido.com/v3.6/applicants");
        var mine = new RestClient("https://api.withpersona.com/api/v1/inquiries");
        var charge = await http.PostAsync("https://api.stripe.com/v1/payment_intents", new FormUrlEncodedContent([]));
        var customer = await http.GetStringAsync("https://api.stripe.com/v1/customers/cus_123");
    }
}

public class RestClient(string baseUrl)
{
    public string BaseUrl { get; } = baseUrl;
}
