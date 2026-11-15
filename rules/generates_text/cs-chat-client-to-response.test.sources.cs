// lexcode-expect: 9
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.TextGeneration;
using OpenAI;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // $SP.GetRequiredService<Microsoft.Extensions.AI.IChatClient>(...)
    public async Task<IActionResult> Case1(IServiceProvider services)
    {
        var made = services.GetRequiredService<IChatClient>();
        var r = await made.GetResponseAsync("q");
        return Ok(r);
    }

    // $SP.GetService<Microsoft.Extensions.AI.IChatClient>(...)
    public async Task<IActionResult> Case2(IServiceProvider services)
    {
        var made = services.GetService<IChatClient>();
        var r = await made.GetResponseAsync("q");
        return Ok(r);
    }

    // $V.AsIChatClient(...)
    public async Task<IActionResult> Case3(IVendorClient vendor)
    {
        var made = vendor.AsIChatClient();
        var r = await made.GetResponseAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>(...)
    public async Task<IActionResult> Case4(IServiceProvider services)
    {
        var made = services.GetRequiredService<IChatCompletionService>();
        var r = await made.GetChatMessageContentAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.TextGeneration.ITextGenerationService>(...)
    public async Task<IActionResult> Case5(IServiceProvider services)
    {
        var made = services.GetRequiredService<ITextGenerationService>();
        var r = await made.GetTextContentAsync("q");
        return Ok(r);
    }

    // (OpenAI.OpenAIClient $C).GetChatClient(...)
    public async Task<IActionResult> Case6(OpenAIClient client)
    {
        var made = client.GetChatClient("model");
        var r = await made.CompleteChatAsync("q");
        return Ok(r);
    }

    // (OpenAI.OpenAIClient $C).GetOpenAIResponseClient(...)
    public async Task<IActionResult> Case7(OpenAIClient client)
    {
        var made = client.GetOpenAIResponseClient("model");
        var r = await made.CreateResponseAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetChatClient(...)
    public async Task<IActionResult> Case8(AzureOpenAIClient client)
    {
        var made = client.GetChatClient("model");
        var r = await made.CompleteChatAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetOpenAIResponseClient(...)
    public async Task<IActionResult> Case9(AzureOpenAIClient client)
    {
        var made = client.GetOpenAIResponseClient("model");
        var r = await made.CreateResponseAsync("q");
        return Ok(r);
    }
}
