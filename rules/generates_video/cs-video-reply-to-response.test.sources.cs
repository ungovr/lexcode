// lexcode-expect: 21
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Amazon.BedrockRuntime.Model;
using Google.GenAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Google.GenAI.Client $C).Models.GenerateVideosAsync(...)
    public async Task<IActionResult> Case1(Client client)
    {
        var r = await client.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q");
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.StartAsyncInvokeRequest { ModelId = ... }
    public async Task<IActionResult> Case2(IRuntimeClient runtime)
    {
        var request = new StartAsyncInvokeRequest { ContentType = "application/json", ModelId = "amazon.nova-reel-v1:1" };
        var r = await runtime.StartAsyncInvokeAsync(request);
        return Ok(r);
    }

    // Amazon.BedrockRuntime.Model.StartAsyncInvokeRequest declared with target-typed new()
    public async Task<IActionResult> Case3(IRuntimeClient runtime)
    {
        StartAsyncInvokeRequest request = new() { ContentType = "application/json", ModelId = "amazon.nova-reel-v1:1" };
        var r = await runtime.StartAsyncInvokeAsync(request);
        return Ok(r);
    }

    // $HTTP.PostAsync
    public async Task<IActionResult> Case4(HttpClient http, string id)
    {
        var r = await http.PostAsync("https://api.openai.com/v1/videos", null);
        return Ok(r);
    }

    // $HTTP.PostAsJsonAsync
    public async Task<IActionResult> Case5(HttpClient http, string id)
    {
        var r = await http.PostAsJsonAsync("https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning", new { prompt = "q" });
        return Ok(r);
    }

    // $HTTP.GetAsync
    public async Task<IActionResult> Case6(HttpClient http, string id)
    {
        var r = await http.GetAsync($"https://api.openai.com/v1/videos/{id}");
        return Ok(r);
    }

    // $HTTP.GetStreamAsync
    public async Task<IActionResult> Case7(HttpClient http, string id)
    {
        var r = await http.GetStreamAsync($"https://api.openai.com/v1/videos/{id}/content");
        return Ok(r);
    }

    // $HTTP.GetByteArrayAsync
    public async Task<IActionResult> Case8(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content");
        return Ok(r);
    }

    // $HTTP.PostAsync, named
    public async Task<IActionResult> Case9(HttpClient http, string id)
    {
        var r = await http.PostAsync(requestUri: "https://api.openai.com/v1/videos", content: null);
        return Ok(r);
    }

    // $HTTP.PostAsJsonAsync, named
    public async Task<IActionResult> Case10(HttpClient http, string id)
    {
        var r = await http.PostAsJsonAsync(requestUri: "https://api.dev.runwayml.com/v1/text_to_video", value: new { promptText = "q" });
        return Ok(r);
    }

    // $HTTP.GetAsync, named
    public async Task<IActionResult> Case11(HttpClient http, string id)
    {
        var r = await http.GetAsync(requestUri: $"https://api.openai.com/v1/videos/{id}");
        return Ok(r);
    }

    // $HTTP.GetStreamAsync, named
    public async Task<IActionResult> Case12(HttpClient http, string id)
    {
        var r = await http.GetStreamAsync(requestUri: $"https://api.openai.com/v1/videos/{id}/content");
        return Ok(r);
    }

    // $HTTP.GetByteArrayAsync, named
    public async Task<IActionResult> Case13(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync(requestUri: $"https://api.openai.com/v1/videos/{id}/content");
        return Ok(r);
    }

    // new System.Net.Http.HttpRequestMessage, sent
    public async Task<IActionResult> Case14(HttpClient http, string id)
    {
        var request = new System.Net.Http.HttpRequestMessage(HttpMethod.Post, "https://api.dev.runwayml.com/v1/image_to_video");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // new HttpRequestMessage, sent
    public async Task<IActionResult> Case15(HttpClient http, string id)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://us-central1-aiplatform.googleapis.com/v1/projects/p/locations/us-central1/publishers/google/models/veo-3.0-generate-001:predictLongRunning");
        var r = http.Send(request);
        return Ok(r);
    }

    // new System.Net.Http.HttpRequestMessage, named, sent
    public async Task<IActionResult> Case16(HttpClient http, string id)
    {
        var request = new System.Net.Http.HttpRequestMessage(method: HttpMethod.Post, requestUri: "https://api.openai.com/v1/videos");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // new HttpRequestMessage, named, sent
    public async Task<IActionResult> Case17(HttpClient http, string id)
    {
        var request = new HttpRequestMessage(requestUri: "https://api.dev.runwayml.com/v1/text_to_video", method: HttpMethod.Post) { Content = null };
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // System.Net.Http.HttpRequestMessage declared with new(), sent
    public async Task<IActionResult> Case18(HttpClient http, string id)
    {
        System.Net.Http.HttpRequestMessage request = new(HttpMethod.Post, "https://api.openai.com/v1/videos") { Content = null };
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // HttpRequestMessage declared with new(), sent
    public async Task<IActionResult> Case19(HttpClient http, string id)
    {
        HttpRequestMessage request = new(HttpMethod.Post, "https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // System.Net.Http.HttpRequestMessage declared with new(), named, sent
    public async Task<IActionResult> Case20(HttpClient http, string id)
    {
        System.Net.Http.HttpRequestMessage request = new(method: HttpMethod.Post, requestUri: "https://api.openai.com/v1/videos");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // HttpRequestMessage declared with new(), named, sent
    public async Task<IActionResult> Case21(HttpClient http, string id)
    {
        HttpRequestMessage request = new(method: HttpMethod.Post, requestUri: "https://api.dev.runwayml.com/v1/image_to_video") { Content = null };
        var r = await http.SendAsync(request);
        return Ok(r);
    }
}
