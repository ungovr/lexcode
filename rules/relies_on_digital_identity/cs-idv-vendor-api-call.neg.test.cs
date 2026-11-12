// lexcode-expect: 0
using Microsoft.Extensions.Logging;

namespace MyShop.Accounts;

// A social sign-in endpoint, a vendor's web page that is not its API, an API address only named in a
// log line, and the app's own client class named like RestSharp's.
public class Links(HttpClient http, ILogger<Links> logger)
{
    public async Task RunAsync()
    {
        var authorize = new Uri("https://accounts.google.com/o/oauth2/v2/auth");
        var privacy = await http.GetStringAsync("https://onfido.com/privacy/");
        var pricing = new Uri("https://www.veriff.com/pricing");
        logger.LogInformation("Applicants are checked at https://api.onfido.com/v3.6/applicants");
        var mine = new RestClient("https://dashboard.withpersona.com/inquiries");
    }
}

public class RestClient(string baseUrl)
{
    public string BaseUrl { get; } = baseUrl;
}
