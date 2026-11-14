// lexcode-expect: 4
// Every source branch, its library imported with a using line.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
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

    // new Mscc.GenerativeAI.GenerativeModel(...) { ... }
    public async Task<IActionResult> Case2(string q)
    {
        var made = new GenerativeModel("key");
        var r = await made.GenerateContent(q);
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GoogleAI $C).GenerativeModel(...)
    public async Task<IActionResult> Case3(GoogleAI client)
    {
        var made = client.GenerativeModel("model");
        var r = await made.GenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.VertexAI $C).GenerativeModel(...)
    public async Task<IActionResult> Case4(VertexAI client)
    {
        var made = client.GenerativeModel("model");
        var r = await made.GenerateContent("q");
        return Ok(r);
    }
}
