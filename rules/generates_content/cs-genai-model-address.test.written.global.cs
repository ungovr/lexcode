// lexcode-expect: 6
// The short-form request messages of the written-address fixture in a file with no
// `using System.Net.Http;` (the SDK imports it implicitly), so only the short-form patterns read
// them: constructed and target-typed, by position and named.
namespace Demo.Written;

public class GeminiWrittenGlobal(HttpClient http)
{
    public async Task MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent") { Content = content });
    }

    public async Task MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(requestUri: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", method: HttpMethod.Post));
    }

    public async Task TargetTypedInterpolated(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(HttpMethod.Post, $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}") { Content = content };
        await http.SendAsync(m);
    }

    public async Task TargetTypedQualifiedVerbatim(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(HttpMethod.Post, @$"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent");
        await http.SendAsync(m);
    }

    public async Task TargetTypedNamedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(requestUri: $@"https://{trace}-aiplatform.googleapis.com/v1/projects/p/locations/l/publishers/google/models/{model}:generateContent", method: HttpMethod.Post);
        await http.SendAsync(m);
    }

    public async Task TargetTypedNamedQualifiedJoined(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(method: HttpMethod.Post, requestUri: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent");
        await http.SendAsync(m);
    }
}
