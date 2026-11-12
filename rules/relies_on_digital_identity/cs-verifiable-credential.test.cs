// lexcode-expect: 4
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace MyShop.Verify;

// Microsoft Entra Verified ID: the app asks a person's wallet for a credential, then acts on the
// verified presentation the request service calls back with.
public class PresentationController(HttpClient http, IConfiguration config)
{
    public async Task<string> StartAsync(object request)
    {
        var url = $"{config["VerifiedID:ApiEndpoint"]}createPresentationRequest";          // 1
        var direct = "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createPresentationRequest"; // 2
        var response = await http.PostAsJsonAsync(url, request);
        return await response.Content.ReadAsStringAsync() + direct;
    }

    public bool OnCallback(CallbackEvent callback)
    {
        if (callback.RequestStatus == "presentation_verified")                              // 3
        {
            return true;
        }
        return callback.RequestStatus switch
        {
            "presentation_verified" => true,                                                // 4
            _ => false,
        };
    }
}

public record CallbackEvent(string RequestStatus);
