// lexcode-expect: 2
// Every source branch whose library type can be aliased, reached through the alias.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
using AABM2 = Amazon.BedrockRuntime.Model;
using AGG1 = Google.GenAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Google.GenAI.Client $C).Models.GenerateVideosAsync(...)
    public async Task<IActionResult> Case1(AGG1.Client client)
    {
        var r = await client.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q");
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.StartAsyncInvokeRequest { ModelId = ... }
    public async Task<IActionResult> Case2(IRuntimeClient runtime)
    {
        var request = new AABM2.StartAsyncInvokeRequest { ContentType = "application/json", ModelId = "amazon.nova-reel-v1:1" };
        var r = await runtime.StartAsyncInvokeAsync(request);
        return Ok(r);
    }
}
