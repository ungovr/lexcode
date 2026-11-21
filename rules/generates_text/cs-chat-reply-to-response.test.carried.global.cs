// lexcode-expect: 4
// The carried-value request messages in a file with no `using System.Net.Http;` (the SDK imports it
// implicitly), so only the short-form patterns read them: each joined const of the evidence carried
// fixture put in a short and a target-typed request message, each reply sent back from a controller
// action.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Carried;

public class TextCarriedGlobalController(HttpClient http) : ControllerBase
{
    private const string Base0 = "https://api.openai.com";
    private const string Base1 = "https://api.anthropic.com";
    private const string Base2 = "https://api.deepseek.com";
    private const string ChatQuery = Base0 + "/v1/chat/completions?api-version=2024-10-01";
    private const string Claude = Base1 + "/v1/messages";

    public async Task<IActionResult> ChatQueryMessage()
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, ChatQuery));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatQueryTargetTyped()
    {
        HttpRequestMessage m = new(HttpMethod.Post, ChatQuery);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeMessage()
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Claude));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeTargetTyped()
    {
        HttpRequestMessage m = new(HttpMethod.Post, Claude);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
