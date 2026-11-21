// lexcode-expect: 0
// A lookalike of each hosted text model's host (the vendor's host followed by another domain),
// with the generation path after it. The host must end where the path begins.
// Each address is sent from its own controller action, whose reply is the response: written at
// the call, held in an interpolated local, held in a const that is posted, posted as JSON (plain
// and generic) or put in a request message (short, fully qualified and target-typed), and held in
// an expression-bodied property joined from a lookalike base.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Lookalikes;

public class TextLookalikesController(HttpClient http) : ControllerBase
{
    private const string OpenAiLookalike = "https://api.openai.com.example.net/v1/chat/completions";
    private const string OpenAiLookalikeBase = "https://api.openai.com.example.net";
    public static string OpenAiJoined => OpenAiLookalikeBase + "/v1/chat/completions";
    private const string AnthropicLookalike = "https://api.anthropic.com.example.net/v1/messages";
    private const string AnthropicLookalikeBase = "https://api.anthropic.com.example.net";
    public static string AnthropicJoined => AnthropicLookalikeBase + "/v1/messages";
    private const string MistralLookalike = "https://api.mistral.ai.example.net/v1/chat/completions";
    private const string MistralLookalikeBase = "https://api.mistral.ai.example.net";
    public static string MistralJoined => MistralLookalikeBase + "/v1/chat/completions";
    private const string GroqLookalike = "https://api.groq.com.example.net/openai/v1/chat/completions";
    private const string GroqLookalikeBase = "https://api.groq.com.example.net";
    public static string GroqJoined => GroqLookalikeBase + "/openai/v1/chat/completions";
    private const string DeepSeekLookalike = "https://api.deepseek.com.example.net/chat/completions";
    private const string DeepSeekLookalikeBase = "https://api.deepseek.com.example.net";
    public static string DeepSeekJoined => DeepSeekLookalikeBase + "/chat/completions";

    public async Task<IActionResult> OpenAi(object body)
    {
        var r = await http.PostAsync("https://api.openai.com.example.net/v1/chat/completions", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiConst(object body)
    {
        var r = await http.PostAsync(OpenAiLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiJson(object body)
    {
        var r = await http.PostAsJsonAsync(OpenAiLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(OpenAiLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, OpenAiLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, OpenAiLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, OpenAiLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiJoined(object body)
    {
        var r = await http.PostAsync(OpenAiJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> OpenAiLocal(object body)
    {
        var url = $"https://api.openai.com.example.net/v1/chat/completions?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Anthropic(object body)
    {
        var r = await http.PostAsync("https://api.anthropic.com.example.net/v1/messages", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicConst(object body)
    {
        var r = await http.PostAsync(AnthropicLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicJson(object body)
    {
        var r = await http.PostAsJsonAsync(AnthropicLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(AnthropicLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, AnthropicLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, AnthropicLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, AnthropicLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicJoined(object body)
    {
        var r = await http.PostAsync(AnthropicJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AnthropicLocal(object body)
    {
        var url = $"https://api.anthropic.com.example.net/v1/messages?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Mistral(object body)
    {
        var r = await http.PostAsync("https://api.mistral.ai.example.net/v1/chat/completions", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralConst(object body)
    {
        var r = await http.PostAsync(MistralLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralJson(object body)
    {
        var r = await http.PostAsJsonAsync(MistralLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(MistralLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, MistralLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, MistralLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, MistralLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralJoined(object body)
    {
        var r = await http.PostAsync(MistralJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MistralLocal(object body)
    {
        var url = $"https://api.mistral.ai.example.net/v1/chat/completions?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Groq(object body)
    {
        var r = await http.PostAsync("https://api.groq.com.example.net/openai/v1/chat/completions", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqConst(object body)
    {
        var r = await http.PostAsync(GroqLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqJson(object body)
    {
        var r = await http.PostAsJsonAsync(GroqLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(GroqLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, GroqLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, GroqLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, GroqLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqJoined(object body)
    {
        var r = await http.PostAsync(GroqJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GroqLocal(object body)
    {
        var url = $"https://api.groq.com.example.net/openai/v1/chat/completions?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeek(object body)
    {
        var r = await http.PostAsync("https://api.deepseek.com.example.net/chat/completions", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekConst(object body)
    {
        var r = await http.PostAsync(DeepSeekLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekJson(object body)
    {
        var r = await http.PostAsJsonAsync(DeepSeekLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(DeepSeekLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, DeepSeekLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, DeepSeekLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, DeepSeekLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekJoined(object body)
    {
        var r = await http.PostAsync(DeepSeekJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekLocal(object body)
    {
        var url = $"https://api.deepseek.com.example.net/chat/completions?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
