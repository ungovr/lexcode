// lexcode-expect: 18
// Generation addresses the engine carries to the call (#13205 review A3), each joined from a base
// const (a value only the carried-value branch reads, since no literal holds it whole): OpenAI's
// chat completions with a query and Anthropic's Messages API held in consts, and DeepSeek's chat
// endpoint with a query held in a local, each sent in every shape the carried-value sources read
// (posted, posted as JSON plain and generic, a short, qualified and target-typed request message),
// each reply sent back from its own controller action.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Carried;

public class TextCarriedController(HttpClient http) : ControllerBase
{
    private const string Base0 = "https://api.openai.com";
    private const string Base1 = "https://api.anthropic.com";
    private const string Base2 = "https://api.deepseek.com";
    private const string ChatQuery = Base0 + "/v1/chat/completions?api-version=2024-10-01";
    private const string Claude = Base1 + "/v1/messages";

    public async Task<IActionResult> ChatQueryPost(object body)
    {
        var r = await http.PostAsync(ChatQuery, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatQueryJson(object body)
    {
        var r = await http.PostAsJsonAsync(ChatQuery, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatQueryJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(ChatQuery, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatQueryMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, ChatQuery));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatQueryQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, ChatQuery));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatQueryTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, ChatQuery);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudePost(object body)
    {
        var r = await http.PostAsync(Claude, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeJson(object body)
    {
        var r = await http.PostAsJsonAsync(Claude, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Claude, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Claude));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Claude));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ClaudeTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Claude);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQueryPost(object body)
    {
        var url = Base2 + "/chat/completions?trace=1";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQueryJson(object body)
    {
        var url = Base2 + "/chat/completions?trace=1";
        var r = await http.PostAsJsonAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQueryJsonT(object body)
    {
        var url = Base2 + "/chat/completions?trace=1";
        var r = await http.PostAsJsonAsync<object>(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQueryMessage(object body)
    {
        var url = Base2 + "/chat/completions?trace=1";
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQueryQualified(object body)
    {
        var url = Base2 + "/chat/completions?trace=1";
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> DeepSeekQueryTargetTyped(object body)
    {
        var url = Base2 + "/chat/completions?trace=1";
        HttpRequestMessage m = new(HttpMethod.Post, url);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
