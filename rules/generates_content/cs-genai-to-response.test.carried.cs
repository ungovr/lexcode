// lexcode-expect: 18
// Generation addresses the engine carries to the call (#13205 review A3), each joined from a base
// const (a value only the carried-value branch reads, since no literal holds it whole): Gemini's
// generateContent with a key and Vertex AI's streamGenerateContent held in consts, and Gemini's
// streamGenerateContent with alt=sse held in a local, each sent in every shape the carried-value
// sources read (posted, posted as JSON plain and generic, a short, qualified and target-typed
// request message), each reply sent back from its own controller action.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Carried;

public class GeminiCarriedController(HttpClient http) : ControllerBase
{
    private const string Base0 = "https://generativelanguage.googleapis.com";
    private const string Base1 = "https://us-central1-aiplatform.googleapis.com";
    private const string FlashQuery = Base0 + "/v1beta/models/gemini-2.5-flash:generateContent?key=k";
    private const string Vertex = Base1 + "/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent";

    public async Task<IActionResult> FlashQueryPost(object body)
    {
        var r = await http.PostAsync(FlashQuery, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FlashQueryJson(object body)
    {
        var r = await http.PostAsJsonAsync(FlashQuery, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FlashQueryJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(FlashQuery, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FlashQueryMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, FlashQuery));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FlashQueryQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, FlashQuery));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FlashQueryTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, FlashQuery);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexPost(object body)
    {
        var r = await http.PostAsync(Vertex, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexJson(object body)
    {
        var r = await http.PostAsJsonAsync(Vertex, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Vertex, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Vertex));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Vertex));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Vertex);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> StreamPost(object body)
    {
        var url = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> StreamJson(object body)
    {
        var url = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        var r = await http.PostAsJsonAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> StreamJsonT(object body)
    {
        var url = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        var r = await http.PostAsJsonAsync<object>(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> StreamMessage(object body)
    {
        var url = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> StreamQualified(object body)
    {
        var url = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> StreamTargetTyped(object body)
    {
        var url = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        HttpRequestMessage m = new(HttpMethod.Post, url);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
