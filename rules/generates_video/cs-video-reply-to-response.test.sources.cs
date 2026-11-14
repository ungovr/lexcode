// lexcode-expect: 9
// Every source branch, its library imported with a using line.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
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

    // $HTTP.PostAsync
    public async Task<IActionResult> Case3(HttpClient http, string id)
    {
        var r = await http.PostAsync("https://api.openai.com/v1/videos", null);
        return Ok(r);
    }

    // $HTTP.PostAsJsonAsync
    public async Task<IActionResult> Case4(HttpClient http, string id)
    {
        var r = await http.PostAsJsonAsync("https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning", new { prompt = "q" });
        return Ok(r);
    }

    // $HTTP.GetAsync
    public async Task<IActionResult> Case5(HttpClient http, string id)
    {
        var r = await http.GetAsync($"https://api.openai.com/v1/videos/{id}");
        return Ok(r);
    }

    // $HTTP.GetStreamAsync
    public async Task<IActionResult> Case6(HttpClient http, string id)
    {
        var r = await http.GetStreamAsync($"https://api.openai.com/v1/videos/{id}/content");
        return Ok(r);
    }

    // $HTTP.GetByteArrayAsync
    public async Task<IActionResult> Case7(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content");
        return Ok(r);
    }

    // new System.Net.Http.HttpRequestMessage, sent
    public async Task<IActionResult> Case8(HttpClient http, string id)
    {
        var request = new System.Net.Http.HttpRequestMessage(HttpMethod.Post, "https://api.dev.runwayml.com/v1/image_to_video");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // new HttpRequestMessage, sent
    public async Task<IActionResult> Case9(HttpClient http, string id)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://us-central1-aiplatform.googleapis.com/v1/projects/p/locations/us-central1/publishers/google/models/veo-3.0-generate-001:predictLongRunning");
        var r = http.Send(request);
        return Ok(r);
    }
}
