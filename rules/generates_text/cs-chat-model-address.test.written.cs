// lexcode-expect: 16
// Hosted text model addresses built where they are sent, which only the written-address branch reads
// (the engine carries no value for them, #13205 review A3): interpolated, verbatim interpolated
// in both prefix orders, joined and formatted, spread over every shape the branch names (posted,
// posted as JSON plain and generic, each by position and with a named requestUri, a request
// message short and qualified, by position and named, constructed and target-typed, and a base
// address from a Uri short and qualified).
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Written;

public class TextWritten(HttpClient http)
{
    public async Task PostInterpolated(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsync($"https://api.openai.com/v1/chat/completions?trace={trace}", content);
    }

    public async Task JsonVerbatim(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync(@$"https://api.anthropic.com/v1/messages?trace={trace}", content);
    }

    public async Task JsonTVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync<object>($@"https://api.mistral.ai/v1/chat/completions?trace={trace}", content);
    }

    public async Task PostNamedJoined(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsync(content: content, requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace);
    }

    public async Task JsonNamedFormatted(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync(value: content, requestUri: string.Format("https://api.deepseek.com/chat/completions?trace={0}", trace));
    }

    public async Task JsonTNamedInterpolated(HttpContent content, string model, string key, string trace)
    {
        await http.PostAsJsonAsync<object>(value: content, requestUri: $"https://api.openai.com/v1/chat/completions?trace={trace}");
    }

    public async Task MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://api.anthropic.com/v1/messages?trace={trace}") { Content = content });
    }

    public async Task MessageQualifiedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, $@"https://api.mistral.ai/v1/chat/completions?trace={trace}"));
    }

    public async Task MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new HttpRequestMessage(requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace, method: HttpMethod.Post));
    }

    public async Task MessageNamedQualifiedFormatted(HttpContent content, string model, string key, string trace)
    {
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(method: HttpMethod.Post, requestUri: string.Format("https://api.deepseek.com/chat/completions?trace={0}", trace)));
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

    public async Task UriFormatted(HttpContent content, string model, string key, string trace)
    {
        http.BaseAddress = new Uri(string.Format("https://api.deepseek.com/chat/completions?trace={0}", trace));
    }

    public async Task UriQualifiedInterpolated(HttpContent content, string model, string key, string trace)
    {
        http.BaseAddress = new System.Uri($"https://api.openai.com/v1/chat/completions?trace={trace}");
    }
}
