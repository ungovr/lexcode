// lexcode-expect: 6
// Every source branch whose library type can be aliased, reached through the alias.
// One action per source branch, each sending what the source produced back as the
// response.
using AGCAV1 = Google.Cloud.AIPlatform.V1;
using AMG2 = Mscc.GenerativeAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // new Google.Cloud.AIPlatform.V1.GenerateContentRequest { ... }
    public async Task<IActionResult> Case1(IVertexGateway vertex)
    {
        var request = new AGCAV1.GenerateContentRequest { Model = "gemini-2.5-pro" };
        var r = await vertex.GenerateContentAsync(request);
        return Ok(r);
    }

    // Google.Cloud.AIPlatform.V1.GenerateContentRequest declared with target-typed new()
    public async Task<IActionResult> Case2(IVertexGateway vertex)
    {
        AGCAV1.GenerateContentRequest request = new() { Model = "gemini-2.5-pro" };
        var r = await vertex.GenerateContentAsync(request);
        return Ok(r);
    }

    // new Mscc.GenerativeAI.GenerativeModel(...) { ... }
    public async Task<IActionResult> Case3(string q)
    {
        var made = new AMG2.GenerativeModel("key");
        var r = await made.GenerateContent(q);
        return Ok(r);
    }

    // Mscc.GenerativeAI.GenerativeModel declared with target-typed new()
    public async Task<IActionResult> Case4(string q)
    {
        AMG2.GenerativeModel made = new("key");
        var r = await made.GenerateContent(q);
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GoogleAI $C).GenerativeModel(...)
    public async Task<IActionResult> Case5(AMG2.GoogleAI client)
    {
        var made = client.GenerativeModel("model");
        var r = await made.GenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.VertexAI $C).GenerativeModel(...)
    public async Task<IActionResult> Case6(AMG2.VertexAI client)
    {
        var made = client.GenerativeModel("model");
        var r = await made.GenerateContent("q");
        return Ok(r);
    }
}
