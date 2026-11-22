// lexcode-expect: 14
// Hosted text model addresses built where they are sent, which only the written-address branch reads
// (the engine carries no value for them, #13205 review A3): interpolated, verbatim interpolated
// in both prefix orders, joined and formatted, spread over every shape the branch names (posted,
// posted as JSON plain and generic, each by position and with a named requestUri, a request
// message short and qualified, by position and named, constructed and target-typed, each reply
// sent back from its own controller action).
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Written;

public class TextWrittenController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> PostInterpolated(HttpContent content, string model, string key, string trace)
    {
        var r = await http.PostAsync($"https://api.openai.com/v1/chat/completions?trace={trace}", content);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> JsonVerbatim(HttpContent content, string model, string key, string trace)
    {
        var r = await http.PostAsJsonAsync(@$"https://api.anthropic.com/v1/messages?trace={trace}", content);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> JsonTVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        var r = await http.PostAsJsonAsync<object>($@"https://api.mistral.ai/v1/chat/completions?trace={trace}", content);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> PostNamedJoined(HttpContent content, string model, string key, string trace)
    {
        var r = await http.PostAsync(content: content, requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> JsonNamedFormatted(HttpContent content, string model, string key, string trace)
    {
        var r = await http.PostAsJsonAsync(value: content, requestUri: string.Format("https://api.deepseek.com/chat/completions?trace={0}", trace));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> JsonTNamedInterpolated(HttpContent content, string model, string key, string trace)
    {
        var r = await http.PostAsJsonAsync<object>(value: content, requestUri: $"https://api.openai.com/v1/chat/completions?trace={trace}");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://api.anthropic.com/v1/messages?trace={trace}") { Content = content });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MessageQualifiedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, $@"https://api.mistral.ai/v1/chat/completions?trace={trace}"));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new HttpRequestMessage(requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace, method: HttpMethod.Post));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MessageNamedQualifiedFormatted(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(method: HttpMethod.Post, requestUri: string.Format("https://api.deepseek.com/chat/completions?trace={0}", trace)));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedInterpolated(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(HttpMethod.Post, $"https://api.openai.com/v1/chat/completions?trace={trace}") { Content = content };
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedQualifiedVerbatim(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(HttpMethod.Post, @$"https://api.anthropic.com/v1/messages?trace={trace}");
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedNamedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(requestUri: $@"https://api.mistral.ai/v1/chat/completions?trace={trace}", method: HttpMethod.Post);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedNamedQualifiedJoined(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(method: HttpMethod.Post, requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
