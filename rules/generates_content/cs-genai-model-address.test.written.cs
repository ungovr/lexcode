// lexcode-expect: 16
// Gemini addresses built where they are sent, which only the written-address branch reads
// (the engine carries no value for them, #13205 review A3): interpolated, verbatim interpolated
// in both prefix orders, joined and formatted, spread over every shape the branch names (posted,
// posted as JSON plain and generic, each by position and with a named requestUri, a request
// message short and qualified, by position and named, constructed and target-typed, and a base
// address from a Uri short and qualified).
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Written;

public class GeminiWritten(HttpClient http)
{
    public async Task PostInterpolated(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}", content);
    }

    public async Task JsonVerbatim(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync(@$"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent", content);
    }

    public async Task JsonTVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync<object>($@"https://{trace}-aiplatform.googleapis.com/v1/projects/p/locations/l/publishers/google/models/{model}:generateContent", content);
    }

    public async Task PostNamedJoined(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsync(content: content, requestUri: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent");
    }

    public async Task JsonNamedFormatted(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync(value: content, requestUri: string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", model, key));
    }

    public async Task JsonTNamedInterpolated(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync<object>(value: content, requestUri: $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}");
    }

    public async Task MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent") { Content = content });
    }

    public async Task MessageQualifiedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, $@"https://{trace}-aiplatform.googleapis.com/v1/projects/p/locations/l/publishers/google/models/{model}:generateContent"));
    }

    public async Task MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(requestUri: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", method: HttpMethod.Post));
    }

    public async Task MessageNamedQualifiedFormatted(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(method: HttpMethod.Post, requestUri: string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", model, key)));
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

    public async Task UriFormatted(HttpContent content, string model, string key, string trace)
    {
        http.BaseAddress = new Uri(string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", model, key));
    }

    public async Task UriQualifiedInterpolated(HttpContent content, string model, string key, string trace)
    {
        http.BaseAddress = new System.Uri($"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}");
    }
}
