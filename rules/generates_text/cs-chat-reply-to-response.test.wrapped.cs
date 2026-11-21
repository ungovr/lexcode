// lexcode-expect: 7
// A hosted text model's reply wrapped before it is sent back (#13205 review A6): in a typed object
// with an initializer, in an interpolated string, deserialized into a type, read from JSON with
// ReadFromJsonAsync and a member chain, and read with JsonDocument; set on a Razor page model's
// property, and sent to a SignalR caller. An anonymous object (`Ok(new { text })`) does not carry
// the reply on Opengrep 1.33.1, for an SDK source as for an HTTP one, so the last action does not
// count (rules/README.md, Known C# gaps).
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SignalR;

namespace Demo.Generated;

public class ChatReply
{
    public string Text { get; set; } = "";
    public List<Choice> Choices { get; set; } = [];
}

public class Choice
{
    public ChatReply Message { get; set; } = new();
}

public class WrappedChatController(HttpClient http) : ControllerBase
{
    private const string ChatUrl = "https://api.openai.com/v1/chat/completions";

    public async Task<IActionResult> Typed(HttpContent body)
    {
        var r = await http.PostAsync(ChatUrl, body);
        var text = await r.Content.ReadAsStringAsync();
        return Ok(new ChatReply { Text = text });
    }

    public async Task<IActionResult> Interpolated(HttpContent body)
    {
        var r = await http.PostAsync(ChatUrl, body);
        var text = await r.Content.ReadAsStringAsync();
        return Ok($"Assistant: {text}");
    }

    public async Task<IActionResult> Deserialized(HttpContent body)
    {
        var r = await http.PostAsync(ChatUrl, body);
        var reply = JsonSerializer.Deserialize<ChatReply>(await r.Content.ReadAsStringAsync());
        return Ok(reply);
    }

    public async Task<IActionResult> FromJson(HttpContent body)
    {
        var r = await http.PostAsync(ChatUrl, body);
        var reply = await r.Content.ReadFromJsonAsync<ChatReply>();
        return Ok(reply!.Choices[0].Message.Text);
    }

    public async Task<IActionResult> Document(HttpContent body)
    {
        var r = await http.PostAsync(ChatUrl, body);
        using var doc = JsonDocument.Parse(await r.Content.ReadAsStringAsync());
        return Ok(doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString());
    }

    public async Task<IActionResult> Anonymous(HttpContent body)
    {
        var r = await http.PostAsync(ChatUrl, body);
        var text = await r.Content.ReadAsStringAsync();
        return Ok(new { text });
    }
}

public class AskModel(HttpClient http) : PageModel
{
    public string Reply { get; set; } = "";

    public async Task OnPostAsync(HttpContent body)
    {
        var r = await http.PostAsync("https://api.anthropic.com/v1/messages", body);
        Reply = await r.Content.ReadAsStringAsync();
    }
}

public class AskHub(HttpClient http) : Hub
{
    public async Task Ask(HttpContent body)
    {
        var r = await http.PostAsync("https://api.deepseek.com/chat/completions", body);
        var text = await r.Content.ReadAsStringAsync();
        await Clients.Caller.SendAsync("reply", text);
    }
}
