// lexcode-expect: 0
// The app's own ChatClient, IChatClient and Kernel, in Demo.Support: canned replies from a FAQ
// table, no model. They share short names with OpenAI.Chat.ChatClient,
// Microsoft.Extensions.AI.IChatClient and Semantic Kernel's Kernel.
using Demo.Support;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Web;

public class HelpController(IChatClient help, Kernel faq) : ControllerBase
{
    [HttpGet("help")]
    public async Task<IActionResult> Help(string topic)
    {
        var client = new ChatClient("faq");
        var canned = await client.CompleteChatAsync(topic);
        return Ok(canned);
    }

    [HttpGet("answer")]
    public async Task<IActionResult> Answer(string topic)
    {
        var other = await help.GetResponseAsync(topic);
        return Ok(other);
    }

    [HttpGet("prompt")]
    public async Task<IActionResult> Prompt(string topic)
    {
        var entry = await faq.InvokePromptAsync(topic);
        return Ok(entry);
    }
}
