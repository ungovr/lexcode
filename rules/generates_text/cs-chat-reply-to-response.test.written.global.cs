// lexcode-expect: 6
// The short-form request messages of the written-address fixture in a file with no
// `using System.Net.Http;` (the SDK imports it implicitly), so only the short-form patterns read
// them: constructed and target-typed, by position and named, each reply sent back from a
// controller action.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Written;

public class TextWrittenGlobalController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://api.anthropic.com/v1/messages?trace={trace}") { Content = content });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new HttpRequestMessage(requestUri: "https://api.groq.com/openai/v1/chat/completions?trace=" + trace, method: HttpMethod.Post));
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
