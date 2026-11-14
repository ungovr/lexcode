// lexcode-expect: 4
// No using at all: only the vendor-named short forms can match, as in a file whose
// usings are global ones in another file.
// One action per source branch, each sending what the source produced back as the
// response.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.OpenAIClient $C).GetChatClient(...)
    public async Task<IActionResult> Case1(OpenAIClient client)
    {
        var made = client.GetChatClient("model");
        var r = await made.CompleteChatAsync("q");
        return Ok(r);
    }

    // (OpenAI.OpenAIClient $C).GetOpenAIResponseClient(...)
    public async Task<IActionResult> Case2(OpenAIClient client)
    {
        var made = client.GetOpenAIResponseClient("model");
        var r = await made.CreateResponseAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetChatClient(...)
    public async Task<IActionResult> Case3(AzureOpenAIClient client)
    {
        var made = client.GetChatClient("model");
        var r = await made.CompleteChatAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetOpenAIResponseClient(...)
    public async Task<IActionResult> Case4(AzureOpenAIClient client)
    {
        var made = client.GetOpenAIResponseClient("model");
        var r = await made.CreateResponseAsync("q");
        return Ok(r);
    }
}
