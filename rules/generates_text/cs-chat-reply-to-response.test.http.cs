// lexcode-expect: 6
// A hosted text model called with HttpClient and no SDK, its reply sent back from a controller
// action: OpenAI's chat completions with PostAsync, Anthropic's Messages API with PostAsJsonAsync
// and an address held in a const, DeepSeek's chat endpoint through a POST request message,
// Mistral's with an interpolated address and a query, OpenAI's Responses API through a request
// message declared with target-typed new() and named arguments, and Groq's through a local. The
// last action echoes a request message it never sends, which is no reply and does not count.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class HostedChatController(HttpClient http) : ControllerBase
{
    private const string ClaudeUrl = "https://api.anthropic.com/v1/messages";

    public async Task<IActionResult> OpenAi(HttpContent body)
    {
        var r = await http.PostAsync("https://api.openai.com/v1/chat/completions", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Claude(object body)
    {
        var r = await http.PostAsJsonAsync(ClaudeUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeek(HttpContent body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.deepseek.com/chat/completions") { Content = body };
        var r = await http.SendAsync(request);
        return Content(await r.Content.ReadAsStringAsync(), "application/json");
    }

    public async Task<IActionResult> Mistral(HttpContent body, string trace)
    {
        var r = await http.PostAsync($"https://api.mistral.ai/v1/chat/completions?trace={trace}", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Responses(HttpContent body)
    {
        HttpRequestMessage request = new(requestUri: "https://api.openai.com/v1/responses", method: HttpMethod.Post) { Content = body };
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Groq(object body)
    {
        var url = "https://api.groq.com/openai/v1/chat/completions";
        var r = await http.PostAsJsonAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public IActionResult Echo()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        return Ok(request.RequestUri);
    }
}
