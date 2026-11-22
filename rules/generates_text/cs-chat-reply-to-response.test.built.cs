// lexcode-expect: 7
// A hosted text model called with HttpClient at an address built by interpolation, concatenation
// or string.Format, its reply sent back from a controller action (#13205 B1): a local interpolated
// with a query value and posted, a local joined from a base const in a request message, a local
// formatted and posted as JSON, an address joined at the call, and a field, an expression-bodied
// property and an auto-property of the controller that hold one, each posted.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class BuiltChatController(HttpClient http) : ControllerBase
{
    private const string ApiBase = "https://api.openai.com/v1";
    private static string Version = "2024-10-01";
    private readonly string _chatUrl = $"https://api.openai.com/v1/chat/completions?api-version={Version}";
    private static string ClaudeUrl => "https://api.anthropic.com/v1/messages?beta=" + Version;
    public string MistralUrl { get; } = string.Format("https://api.mistral.ai/v1/chat/completions?v={0}", Version);

    public async Task<IActionResult> Interpolated(HttpContent body, string trace)
    {
        var url = $"https://api.deepseek.com/chat/completions?trace={trace}";
        var r = await http.PostAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Joined(HttpContent body)
    {
        string url = ApiBase + "/responses";
        var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = body };
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Formatted(object body, string trace)
    {
        var url = string.Format("https://api.groq.com/openai/v1/chat/completions?trace={0}", trace);
        var r = await http.PostAsJsonAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AtTheCall(HttpContent body, string v)
    {
        var r = await http.PostAsync("https://api.openai.com/v1/chat/completions?api-version=" + v, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Field(HttpContent body)
    {
        var r = await http.PostAsync(_chatUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Property(HttpContent body)
    {
        var r = await http.PostAsync(ClaudeUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AutoProperty(HttpContent body)
    {
        var r = await http.PostAsync(MistralUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
