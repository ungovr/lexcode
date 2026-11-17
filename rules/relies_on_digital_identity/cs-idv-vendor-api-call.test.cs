// lexcode-expect: 10
using System.Net.Http.Json;
using RestSharp;
using Rs = RestSharp;

namespace MyShop.Kyc;

public class KycClient(HttpClient http, IHttpClientFactory factory)
{
    public async Task RunAsync(string applicantId, object body)
    {
        var inquiry = await http.PostAsJsonAsync("https://withpersona.com/api/v1/inquiries", body); // 1
        var decision = await http.GetStringAsync($"https://stationapi.veriff.com/v1/sessions/{applicantId}/decision"); // 2
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.onfido.com/v3.6/workflow_runs"); // 3
        await http.SendAsync(request);

        var named = factory.CreateClient("sumsub");
        named.BaseAddress = new Uri("https://api.sumsub.com/resources/");                 // 4
        var check = await named.GetFromJsonAsync<object>(@"https://api.idenfy.com/api/v2/status"); // 5

        var rest = new RestClient("https://netverify.com/api/v4/initiate");               // 6 using
        var restAlias = new Rs.RestClient(new RestClientOptions { Timeout = TimeSpan.FromSeconds(5) });
        var req = new Rs.RestRequest("https://api.trulioo.com/v3/verifications/verify"); // 7 alias
        var full = new System.Net.Http.HttpRequestMessage(HttpMethod.Get, "https://api.yoti.com/idverify/v1/sessions"); // 8

        // Stripe Identity over its REST API, on a client the engine knows no type for
        var stripe = factory.CreateClient("stripe");
        await stripe.PostAsync("https://api.stripe.com/v1/identity/verification_sessions", new FormUrlEncodedContent([])); // 9
        var report = await stripe.GetStringAsync($"https://api.stripe.com/v1/identity/verification_reports/{applicantId}"); // 10
    }
}
