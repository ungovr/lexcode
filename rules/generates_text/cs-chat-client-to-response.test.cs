// lexcode-expect: 6
// A chat client taken into a local, where the engine cannot type it, and followed to the
// response: from the Azure OpenAI and OpenAI clients, adapted with AsIChatClient, from the service
// container and from a Semantic Kernel kernel. The last case is the eShop shape: a Blazor
// component hands the client to the chat state it renders.
using Azure;
using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using OpenAI;

namespace Demo.Web;

public class AssistantController(IServiceProvider services, Kernel kernel) : ControllerBase
{
    [HttpPost("azure")]
    public async Task<IActionResult> Azure(string q)
    {
        var azure = new AzureOpenAIClient(new Uri("https://example.openai.azure.com"), new AzureKeyCredential("key"));
        var chat = azure.GetChatClient("gpt-4o");
        var completion = await chat.CompleteChatAsync(q);
        return Ok(completion.Value.Content[0].Text);
    }

    [HttpPost("adapted")]
    public async Task<IActionResult> Adapted(string q)
    {
        var chat = new AzureOpenAIClient(new Uri("https://example.openai.azure.com"), new AzureKeyCredential("key")).GetChatClient("gpt-4o").AsIChatClient();
        var r = await chat.GetResponseAsync(q);
        return Ok(r.Text);
    }

    [HttpPost("container")]
    public async Task<IActionResult> Container(string q)
    {
        var chat = services.GetRequiredService<IChatClient>();
        var r = await chat.GetResponseAsync(q);
        return Ok(r.Text);
    }

    [HttpPost("kernel")]
    public async Task<IActionResult> FromKernel(string q)
    {
        var service = kernel.GetRequiredService<IChatCompletionService>();
        var message = await service.GetChatMessageContentAsync(q);
        return Ok(message.Content);
    }
}

public static class HaikuEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/haiku", async (string topic, OpenAIClient openAi) =>
            (await openAi.GetChatClient("gpt-4o").CompleteChatAsync(topic)).Value.Content[0].Text);
    }
}

public class ChatState(IChatClient chat)
{
    public IList<ChatMessage> Messages { get; } = [];
}

class __RazorCode
{
    IServiceProvider ServiceProvider;
    ChatState? chatState;

    protected async Task OnInitializedAsync()
    {
        var client = ServiceProvider.GetService<IChatClient>();
        if (client is not null)
        {
            chatState = new ChatState(client);
        }
    }
}
