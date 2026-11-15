// lexcode-expect: 7
// Clips a video model made, sent back to the person who asked: Veo through the Google Gen AI SDK
// (its using line and an alias), Nova Reel on Bedrock, and Sora, Veo and Runway over HTTP.
using System.Net.Http.Json;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Google.GenAI;
using Microsoft.AspNetCore.Mvc;
using GenAI = Google.GenAI;

namespace Demo.Web;

public class ReelController(IAmazonBedrockRuntime bedrock, IHttpClientFactory http) : ControllerBase
{
    [HttpPost("veo")]
    public async Task<IActionResult> Veo(string prompt)
    {
        var client = new Client(apiKey: "key");
        var operation = await client.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: prompt);
        return Ok(operation.Name);
    }

    [HttpPost("veo-aliased")]
    public async Task<IActionResult> VeoAliased(string prompt)
    {
        GenAI.Client client = new(apiKey: "key");
        var operation = await client.Models.GenerateVideosAsync(model: "veo-3.0-fast-generate-001", prompt: prompt);
        return Ok(operation.Name);
    }

    [HttpPost("reel")]
    public async Task<IActionResult> Reel(string prompt)
    {
        var request = new StartAsyncInvokeRequest { ModelId = "amazon.nova-reel-v1:1" };
        var job = await bedrock.StartAsyncInvokeAsync(request);
        return Ok(job.InvocationArn);
    }

    // Sora: the clip's content, copied to the response.
    [HttpGet("sora/{id}")]
    public async Task Sora(string id)
    {
        var client = http.CreateClient("openai");
        var clip = await client.GetStreamAsync($"https://api.openai.com/v1/videos/{id}/content");
        await clip.CopyToAsync(Response.Body);
    }

    [HttpPost("veo-rest")]
    public async Task<IActionResult> VeoRest(string prompt)
    {
        var client = http.CreateClient();
        var response = await client.PostAsJsonAsync("https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning", new { instances = new[] { new { prompt } } });
        return Ok(await response.Content.ReadAsStringAsync());
    }

    [HttpPost("runway")]
    public async Task<IActionResult> Runway(string prompt)
    {
        var client = http.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.dev.runwayml.com/v1/text_to_video") { Content = JsonContent.Create(new { promptText = prompt }) };
        var response = await client.SendAsync(request);
        return Ok(await response.Content.ReadAsStringAsync());
    }

    // Veo on Vertex AI, a request message with no initializer.
    [HttpPost("veo-vertex")]
    public async Task<IActionResult> VeoVertex(string prompt)
    {
        var client = http.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://us-central1-aiplatform.googleapis.com/v1/projects/p/locations/us-central1/publishers/google/models/veo-3.0-generate-001:predictLongRunning");
        var response = await client.SendAsync(request);
        return Ok(await response.Content.ReadAsStringAsync());
    }
}
