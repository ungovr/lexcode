// lexcode-expect: 0
// What the rule does not count, each sent straight back as the response: a client's or
// request's metadata, a null check, and the calls on the same object that generate nothing.
// Removing any one of the rule's sanitizers makes its case match. The is-not-null check
// goes to ViewBag: inside Ok(...) the engine carries no taint through an is pattern.
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using OpenAI;

namespace Demo.Generated;

public class MetadataController : Controller
{
    // $C.Model
    public async Task<IActionResult> Case1(IServiceProvider services, OpenAIClient openAi)
    {
        var chat = openAi.GetChatClient("gpt-4o");
        return Ok(chat.Model);
    }

    // $C.GetService<Microsoft.Extensions.AI.ChatClientMetadata>(...)
    public async Task<IActionResult> Case2(IServiceProvider services, OpenAIClient openAi)
    {
        var chat = services.GetRequiredService<IChatClient>();
        return Ok(chat.GetService<ChatClientMetadata>()?.DefaultModelId);
    }

    // $C is not null
    public async Task<IActionResult> Case3(IServiceProvider services, OpenAIClient openAi)
    {
        var chat = services.GetService<IChatClient>();
        ViewBag.Ready = chat is not null;
        return Ok();
    }

    // $C != null
    public async Task<IActionResult> Case4(IServiceProvider services, OpenAIClient openAi)
    {
        var chat = services.GetService<IChatClient>();
        return Ok(chat != null);
    }
}
