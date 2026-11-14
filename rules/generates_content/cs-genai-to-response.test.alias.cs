// lexcode-expect: 7
// Every source branch whose library type can be aliased, reached through the alias.
// One action per source branch, each sending what the source produced back as the
// response.
using AGCAV2 = Google.Cloud.AIPlatform.V1;
using AGG1 = Google.GenAI;
using AMG3 = Mscc.GenerativeAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Google.GenAI.Client $C).Models.GenerateContentAsync(...)
    public async Task<IActionResult> Case1(AGG1.Client client)
    {
        var r = await client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q");
        return Ok(r);
    }

    // (Google.GenAI.Client $C).Models.GenerateContentStreamAsync(...)
    public async Task<IActionResult> Case2(AGG1.Client client)
    {
        var r = await client.Models.GenerateContentStreamAsync(model: "gemini-2.5-flash", contents: "q");
        return Ok(r);
    }

    // (Google.Cloud.AIPlatform.V1.PredictionServiceClient $C).GenerateContent(...)
    public async Task<IActionResult> Case3(AGCAV2.PredictionServiceClient client)
    {
        var r = await client.GenerateContent("q");
        return Ok(r);
    }

    // (Google.Cloud.AIPlatform.V1.PredictionServiceClient $C).GenerateContentAsync(...)
    public async Task<IActionResult> Case4(AGCAV2.PredictionServiceClient client)
    {
        var r = await client.GenerateContentAsync("q");
        return Ok(r);
    }

    // (Google.Cloud.AIPlatform.V1.PredictionServiceClient $C).StreamGenerateContent(...)
    public async Task<IActionResult> Case5(AGCAV2.PredictionServiceClient client)
    {
        var r = await client.StreamGenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GenerativeModel $C).GenerateContent(...)
    public async Task<IActionResult> Case6(AMG3.GenerativeModel client)
    {
        var r = await client.GenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GenerativeModel $C).GenerateContentStream(...)
    public async Task<IActionResult> Case7(AMG3.GenerativeModel client)
    {
        var r = await client.GenerateContentStream("q");
        return Ok(r);
    }
}
