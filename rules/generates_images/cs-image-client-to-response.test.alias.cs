// lexcode-expect: 3
// Every source branch whose library type can be aliased, reached through the alias.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
using AAAO2 = Azure.AI.OpenAI;
using AO1 = OpenAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.OpenAIClient $C).GetImageClient(...)
    public async Task<IActionResult> Case1(AO1.OpenAIClient client)
    {
        var made = client.GetImageClient("model");
        var r = await made.GenerateImageAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetImageClient(...)
    public async Task<IActionResult> Case2(AAAO2.AzureOpenAIClient client)
    {
        var made = client.GetImageClient("model");
        var r = await made.GenerateImageAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.TextToImage.ITextToImageService>(...)
    public async Task<IActionResult> Case3(IServiceProvider services)
    {
        var made = services.GetRequiredService<Microsoft.SemanticKernel.TextToImage.ITextToImageService>();
        var r = await made.GenerateImageAsync("q");
        return Ok(r);
    }
}
