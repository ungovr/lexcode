// lexcode-expect: 6
// The carried-value request messages in a file with no `using System.Net.Http;` (the SDK imports it
// implicitly), so only the short-form patterns read them: each joined const of the signal carried
// fixture put in a short and a target-typed request message. Each const also counts where it is
// declared.
namespace Demo.Carried;

public class GeminiCarriedGlobal(HttpClient http)
{
    private const string Base0 = "https://generativelanguage.googleapis.com";
    private const string Base1 = "https://us-central1-aiplatform.googleapis.com";
    private const string FlashQuery = Base0 + "/v1beta/models/gemini-2.5-flash:generateContent?key=k";
    private const string Vertex = Base1 + "/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent";

    public async Task FlashQuerySends()
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, FlashQuery));
        HttpRequestMessage m = new(HttpMethod.Post, FlashQuery);
        await http.SendAsync(m);
    }

    public async Task VertexSends()
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Vertex));
        HttpRequestMessage m = new(HttpMethod.Post, Vertex);
        await http.SendAsync(m);
    }
}
