// lexcode-expect: 0
// Addresses next to the Gemini generation ones, carried to the call (#13205 review A3), each joined
// from a base const, so that no literal holds it whole and only the carried-value branch reads it:
// a method name that only begins with generateContent, countTokens, embedContent and a host that
// only ends in aiplatform held in consts, and the model list held in a local, each sent in every
// shape the carried-value sources read and its reply sent back from its own controller action.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Carried;

public class GeminiCarriedReadsController(HttpClient http) : ControllerBase
{
    private const string Base0 = "https://generativelanguage.googleapis.com";
    private const string Base1 = "https://evilaiplatform.googleapis.com";
    private const string Cached = Base0 + "/v1beta/models/gemini-2.5-flash:generateContentCached";
    private const string Count = Base0 + "/v1beta/models/gemini-2.5-flash:countTokens";
    private const string Embed = Base0 + "/v1beta/models/gemini-embedding-001:embedContent";
    private const string FusedVertex = Base1 + "/v1/projects/p/locations/l/publishers/google/models/m:generateContent";

    public async Task<IActionResult> CachedPost(object body)
    {
        var r = await http.PostAsync(Cached, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CachedJson(object body)
    {
        var r = await http.PostAsJsonAsync(Cached, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CachedJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Cached, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CachedMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Cached));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CachedQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Cached));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CachedTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Cached);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountPost(object body)
    {
        var r = await http.PostAsync(Count, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountJson(object body)
    {
        var r = await http.PostAsJsonAsync(Count, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Count, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Count));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Count));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Count);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbedPost(object body)
    {
        var r = await http.PostAsync(Embed, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbedJson(object body)
    {
        var r = await http.PostAsJsonAsync(Embed, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbedJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Embed, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbedMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Embed));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbedQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Embed));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbedTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Embed);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedVertexPost(object body)
    {
        var r = await http.PostAsync(FusedVertex, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedVertexJson(object body)
    {
        var r = await http.PostAsJsonAsync(FusedVertex, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedVertexJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(FusedVertex, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedVertexMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, FusedVertex));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedVertexQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, FusedVertex));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedVertexTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, FusedVertex);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelListPost(object body)
    {
        var url = Base0 + "/v1beta/models";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelListJson(object body)
    {
        var url = Base0 + "/v1beta/models";
        var r = await http.PostAsJsonAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelListJsonT(object body)
    {
        var url = Base0 + "/v1beta/models";
        var r = await http.PostAsJsonAsync<object>(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelListMessage(object body)
    {
        var url = Base0 + "/v1beta/models";
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelListQualified(object body)
    {
        var url = Base0 + "/v1beta/models";
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelListTargetTyped(object body)
    {
        var url = Base0 + "/v1beta/models";
        HttpRequestMessage m = new(HttpMethod.Post, url);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
