// lexcode-expect: 7
// Every source branch, its library imported with a using line.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
using Google.Cloud.AIPlatform.V1;
using Google.GenAI;
using Microsoft.AspNetCore.Mvc;
using Mscc.GenerativeAI;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Google.GenAI.Client $C).Models.GenerateContentAsync(...)
    public async Task<IActionResult> Case1(Client client)
    {
        var r = await client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q");
        return Ok(r);
    }

    // (Google.GenAI.Client $C).Models.GenerateContentStreamAsync(...)
    public async Task<IActionResult> Case2(Client client)
    {
        var r = await client.Models.GenerateContentStreamAsync(model: "gemini-2.5-flash", contents: "q");
        return Ok(r);
    }

    // (Google.Cloud.AIPlatform.V1.PredictionServiceClient $C).GenerateContent(...)
    public async Task<IActionResult> Case3(PredictionServiceClient client)
    {
        var r = await client.GenerateContent("q");
        return Ok(r);
    }

    // (Google.Cloud.AIPlatform.V1.PredictionServiceClient $C).GenerateContentAsync(...)
    public async Task<IActionResult> Case4(PredictionServiceClient client)
    {
        var r = await client.GenerateContentAsync("q");
        return Ok(r);
    }

    // (Google.Cloud.AIPlatform.V1.PredictionServiceClient $C).StreamGenerateContent(...)
    public async Task<IActionResult> Case5(PredictionServiceClient client)
    {
        var r = await client.StreamGenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GenerativeModel $C).GenerateContent(...)
    public async Task<IActionResult> Case6(GenerativeModel client)
    {
        var r = await client.GenerateContent("q");
        return Ok(r);
    }

    // (Mscc.GenerativeAI.GenerativeModel $C).GenerateContentStream(...)
    public async Task<IActionResult> Case7(GenerativeModel client)
    {
        var r = await client.GenerateContentStream("q");
        return Ok(r);
    }
}
