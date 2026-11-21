// lexcode-expect: 0
// Addresses next to the text generation ones, carried to the call (#13205 review A3), each joined
// from a base const (a value only the carried-value branch reads, since no literal holds it whole):
// embeddings, message batches and more path after the chat completions address held in consts, and
// the models list held in a local, each sent in every shape the carried-value sources read and its
// reply sent back from its own controller action.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Carried;

public class TextCarriedReadsController(HttpClient http) : ControllerBase
{
    private const string Base0 = "https://api.openai.com";
    private const string Base1 = "https://api.anthropic.com";
    private const string Embeddings = Base0 + "/v1/embeddings";
    private const string Batches = Base1 + "/v1/messages/batches";
    private const string ChatMore = Base0 + "/v1/chat/completions/abc/messages";

    public async Task<IActionResult> EmbeddingsPost(object body)
    {
        var r = await http.PostAsync(Embeddings, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbeddingsJson(object body)
    {
        var r = await http.PostAsJsonAsync(Embeddings, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbeddingsJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Embeddings, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbeddingsMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Embeddings));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbeddingsQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Embeddings));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> EmbeddingsTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Embeddings);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> BatchesPost(object body)
    {
        var r = await http.PostAsync(Batches, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> BatchesJson(object body)
    {
        var r = await http.PostAsJsonAsync(Batches, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> BatchesJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(Batches, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> BatchesMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Batches));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> BatchesQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Batches));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> BatchesTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, Batches);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatMorePost(object body)
    {
        var r = await http.PostAsync(ChatMore, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatMoreJson(object body)
    {
        var r = await http.PostAsJsonAsync(ChatMore, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatMoreJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(ChatMore, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatMoreMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, ChatMore));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatMoreQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, ChatMore));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ChatMoreTargetTyped(object body)
    {
        HttpRequestMessage m = new(HttpMethod.Post, ChatMore);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelsPost(object body)
    {
        var url = Base0 + "/v1/models";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelsJson(object body)
    {
        var url = Base0 + "/v1/models";
        var r = await http.PostAsJsonAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelsJsonT(object body)
    {
        var url = Base0 + "/v1/models";
        var r = await http.PostAsJsonAsync<object>(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelsMessage(object body)
    {
        var url = Base0 + "/v1/models";
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelsQualified(object body)
    {
        var url = Base0 + "/v1/models";
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, url));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> ModelsTargetTyped(object body)
    {
        var url = Base0 + "/v1/models";
        HttpRequestMessage m = new(HttpMethod.Post, url);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
