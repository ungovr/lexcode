// lexcode-expect: 6
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Google.Cloud.AIPlatform.V1;
using Microsoft.AspNetCore.Mvc;
using Mscc.GenerativeAI;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // new Google.Cloud.AIPlatform.V1.GenerateContentRequest { ... }
    public async Task<IActionResult> Case1(IVertexGateway vertex)
    {
        var request = new GenerateContentRequest { Model = "gemini-2.5-pro" };
        var r = await vertex.GenerateContentAsync(request);
        return Ok(r);
    }

    // Google.Cloud.AIPlatform.V1.GenerateContentRequest declared with target-typed new()
    public async Task<IActionResult> Case2(IVertexGateway vertex)
    {
        GenerateContentRequest request = new() { Model = "gemini-2.5-pro" };
        var r = await vertex.GenerateContentAsync(request);
        return Ok(r);
    }

    // new Mscc.GenerativeAI.GenerativeModel(...) { ... }
    public async Task<IActionResult> Case3(string q)
    {
        var made = new GenerativeModel("key");
        var r = await made.GenerateContent(q);
        return Ok(r);
    }

    // Mscc.GenerativeAI.GenerativeModel declared with target-typed new()
    public async Task<IActionResult> Case4(string q)
    {
        GenerativeModel made = new("key");
        var r = await made.GenerateContent(q);
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GoogleAI $C).GenerativeModel(...)
    public async Task<IActionResult> Case5(GoogleAI client)
    {
        var made = client.GenerativeModel("model");
        var r = await made.GenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.VertexAI $C).GenerativeModel(...)
    public async Task<IActionResult> Case6(VertexAI client)
    {
        var made = client.GenerativeModel("model");
        var r = await made.GenerateContent("q");
        return Ok(r);
    }
}
