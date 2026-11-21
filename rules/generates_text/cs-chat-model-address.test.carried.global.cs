// lexcode-expect: 6
// The carried-value request messages in a file with no `using System.Net.Http;` (the SDK imports it
// implicitly), so only the short-form patterns read them: each joined const of the signal carried
// fixture put in a short and a target-typed request message. Each const also counts where it is
// declared.
namespace Demo.Carried;

public class TextCarriedGlobal(HttpClient http)
{
    private const string Base0 = "https://api.openai.com";
    private const string Base1 = "https://api.anthropic.com";
    private const string Base2 = "https://api.deepseek.com";
    private const string ChatQuery = Base0 + "/v1/chat/completions?api-version=2024-10-01";
    private const string Claude = Base1 + "/v1/messages";

    public async Task ChatQuerySends()
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, ChatQuery));
        HttpRequestMessage m = new(HttpMethod.Post, ChatQuery);
        await http.SendAsync(m);
    }

    public async Task ClaudeSends()
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Claude));
        HttpRequestMessage m = new(HttpMethod.Post, Claude);
        await http.SendAsync(m);
    }
}
