// lexcode-expect: 3
// Every source branch, its library imported with a using line.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel.TextToImage;
using OpenAI;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.OpenAIClient $C).GetImageClient(...)
    public async Task<IActionResult> Case1(OpenAIClient client)
    {
        var made = client.GetImageClient("model");
        var r = await made.GenerateImageAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetImageClient(...)
    public async Task<IActionResult> Case2(AzureOpenAIClient client)
    {
        var made = client.GetImageClient("model");
        var r = await made.GenerateImageAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.TextToImage.ITextToImageService>(...)
    public async Task<IActionResult> Case3(IServiceProvider services)
    {
        var made = services.GetRequiredService<ITextToImageService>();
        var r = await made.GenerateImageAsync("q");
        return Ok(r);
    }
}
