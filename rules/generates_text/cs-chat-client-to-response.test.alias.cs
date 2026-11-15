// lexcode-expect: 8
// Every source branch whose library type can be aliased, reached through the alias.
// One action per source branch, each sending what the source produced back as the
// response.
using AAAO2 = Azure.AI.OpenAI;
using AO1 = OpenAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // $SP.GetRequiredService<Microsoft.Extensions.AI.IChatClient>(...)
    public async Task<IActionResult> Case1(IServiceProvider services)
    {
        var made = services.GetRequiredService<Microsoft.Extensions.AI.IChatClient>();
        var r = await made.GetResponseAsync("q");
        return Ok(r);
    }

    // $SP.GetService<Microsoft.Extensions.AI.IChatClient>(...)
    public async Task<IActionResult> Case2(IServiceProvider services)
    {
        var made = services.GetService<Microsoft.Extensions.AI.IChatClient>();
        var r = await made.GetResponseAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>(...)
    public async Task<IActionResult> Case3(IServiceProvider services)
    {
        var made = services.GetRequiredService<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>();
        var r = await made.GetChatMessageContentAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.TextGeneration.ITextGenerationService>(...)
    public async Task<IActionResult> Case4(IServiceProvider services)
    {
        var made = services.GetRequiredService<Microsoft.SemanticKernel.TextGeneration.ITextGenerationService>();
        var r = await made.GetTextContentAsync("q");
        return Ok(r);
    }

    // (OpenAI.OpenAIClient $C).GetChatClient(...)
    public async Task<IActionResult> Case5(AO1.OpenAIClient client)
    {
        var made = client.GetChatClient("model");
        var r = await made.CompleteChatAsync("q");
        return Ok(r);
    }

    // (OpenAI.OpenAIClient $C).GetOpenAIResponseClient(...)
    public async Task<IActionResult> Case6(AO1.OpenAIClient client)
    {
        var made = client.GetOpenAIResponseClient("model");
        var r = await made.CreateResponseAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetChatClient(...)
    public async Task<IActionResult> Case7(AAAO2.AzureOpenAIClient client)
    {
        var made = client.GetChatClient("model");
        var r = await made.CompleteChatAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetOpenAIResponseClient(...)
    public async Task<IActionResult> Case8(AAAO2.AzureOpenAIClient client)
    {
        var made = client.GetOpenAIResponseClient("model");
        var r = await made.CreateResponseAsync("q");
        return Ok(r);
    }
}
