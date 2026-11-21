// lexcode-expect: 0
// A lookalike of each Gemini host (the vendor's host followed by another domain, and a name that
// only ends in aiplatform), with the generation path after it. The host must end where the path
// begins, and a regional Vertex AI host is a region, a hyphen and aiplatform.
// Each address is sent from its own controller action, whose reply is the response: written at
// the call, held in an interpolated local, held in a const that is posted, posted as JSON (plain
// and generic) or put in a request message (short, fully qualified and target-typed), and held in
// an expression-bodied property joined from a lookalike base.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Lookalikes;

public class GeminiLookalikesController(HttpClient http) : ControllerBase
{
    private const string GeminiLookalike = "https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent";
    private const string GeminiLookalikeBase = "https://generativelanguage.googleapis.com.example.net";
    public static string GeminiJoined => GeminiLookalikeBase + "/v1beta/models/gemini-2.5-flash:generateContent";
    private const string VertexLookalike = "https://us-central1-aiplatform.googleapis.com.example.net/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent";
    private const string VertexLookalikeBase = "https://us-central1-aiplatform.googleapis.com.example.net";
    public static string VertexJoined => VertexLookalikeBase + "/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent";
    private const string FusedVertex = "https://evilaiplatform.googleapis.com/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent";

    public async Task<IActionResult> Gemini(object body)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiConst(object body)
    {
        var r = await http.PostAsync(GeminiLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiJson(object body)
    {
        var r = await http.PostAsJsonAsync(GeminiLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(GeminiLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, GeminiLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, GeminiLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, GeminiLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiJoined(object body)
    {
        var r = await http.PostAsync(GeminiJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GeminiLocal(object body)
    {
        var url = $"https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Vertex(object body)
    {
        var r = await http.PostAsync("https://us-central1-aiplatform.googleapis.com.example.net/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent", (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexConst(object body)
    {
        var r = await http.PostAsync(VertexLookalike, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexJson(object body)
    {
        var r = await http.PostAsJsonAsync(VertexLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexJsonT(object body)
    {
        var r = await http.PostAsJsonAsync<object>(VertexLookalike, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexMessage(object body)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, VertexLookalike) { Content = (HttpContent)body });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexQualified(object body)
    {
        var r = await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, VertexLookalike));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexTargetTyped(object body)
    {
        HttpRequestMessage message = new(HttpMethod.Post, VertexLookalike);
        var r = await http.SendAsync(message);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexJoined(object body)
    {
        var r = await http.PostAsync(VertexJoined, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexLocal(object body)
    {
        var url = $"https://us-central1-aiplatform.googleapis.com.example.net/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent?trace={body}";
        var r = await http.PostAsync(url, (HttpContent)body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Fused(HttpContent body)
    {
        var r = await http.PostAsync("https://evilaiplatform.googleapis.com/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FusedConst(HttpContent body)
    {
        var r = await http.PostAsync(FusedVertex, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
