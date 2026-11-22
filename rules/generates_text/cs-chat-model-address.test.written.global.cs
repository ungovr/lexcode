// lexcode-expect: 6
// The short-form request messages of the written-address fixture in a file with no
// `using System.Net.Http;` (the SDK imports it implicitly), so only the short-form patterns read
// them: constructed and target-typed, by position and named.
namespace Demo.Written;

public class TextWrittenGlobal(HttpClient http)
{
    public async Task MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://api.anthropic.com/v1/messages?trace={trace}") { Content = content });
    }

    public async Task MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace, method: HttpMethod.Post));
    }

    public async Task TargetTypedInterpolated(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(HttpMethod.Post, $"https://api.openai.com/v1/chat/completions?trace={trace}") { Content = content };
        await http.SendAsync(m);
    }

    public async Task TargetTypedQualifiedVerbatim(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(HttpMethod.Post, @$"https://api.anthropic.com/v1/messages?trace={trace}");
        await http.SendAsync(m);
    }

    public async Task TargetTypedNamedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(requestUri: $@"https://api.mistral.ai/v1/chat/completions?trace={trace}", method: HttpMethod.Post);
        await http.SendAsync(m);
    }

    public async Task TargetTypedNamedQualifiedJoined(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(method: HttpMethod.Post, requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace);
        await http.SendAsync(m);
    }
}
