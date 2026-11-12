// lexcode-expect: 0
using System.Net.Http.Json;

namespace MyShop.Issuer;

// Issuing a credential to a person's wallet is not relying on one, and an app's own method or
// status names that only contain the words are not the request service's.
public class IssuanceController(HttpClient http)
{
    public async Task<bool> IssueAsync(object request)
    {
        var url = "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createIssuanceRequest";
        var response = await http.PostAsJsonAsync(url, request);
        var status = await response.Content.ReadAsStringAsync();
        return status == "issuance_successful";
    }

    public string BuildPresentationRequestCreator() => "createPresentationRequestTemplate";

    public bool Reviewed(string state) => state == "presentation_verified_by_staff";
}
