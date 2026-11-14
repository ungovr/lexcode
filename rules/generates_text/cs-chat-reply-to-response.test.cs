// lexcode-expect: 18
// Model-written text sent back to the person who asked: MVC controllers, minimal API handlers, a
// Razor Page, a Blazor component and its Razor copy, SignalR hubs and a hub context. The
// libraries are reached through using lines, aliases, constructor and primary-constructor
// parameters, an injected property, and target-typed new.
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Anthropic;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using OpenAI.Chat;
using Ai = Microsoft.Extensions.AI;
using Oai = OpenAI.Chat;

namespace Demo.Web;

public record Summary(string Body);

// Microsoft.Extensions.AI through a constructor parameter.
public class AssistantController : ControllerBase
{
    private readonly IChatClient _chat;

    public AssistantController(IChatClient chat)
    {
        _chat = chat;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask(string question)
    {
        var response = await _chat.GetResponseAsync(question);
        return Ok(response.Text);
    }

    // OpenAI through its alias and target-typed new.
    [HttpPost("draft")]
    public async Task<string> Draft(string topic)
    {
        Oai.ChatClient writer = new("gpt-4o-mini", "key");
        ChatCompletion completion = await writer.CompleteChatAsync($"Draft a post about {topic}");
        return completion.Content[0].Text;
    }

    // Streamed to the caller.
    [HttpGet("stream")]
    public async IAsyncEnumerable<string> Stream(string question)
    {
        await foreach (var update in _chat.GetStreamingResponseAsync(question))
        {
            yield return update.Text;
        }
    }

    // Structured output, as an expression body.
    [HttpGet("summary")]
    public async Task<string> Summarize(string text) => (await _chat.GetResponseAsync<Summary>($"Summarize {text}")).Result.Body;
}

// Primary-constructor parameters: Semantic Kernel, and Microsoft.Extensions.AI through an alias.
public class ReplyController(Kernel kernel, IChatCompletionService completions, Ai.IChatClient chat) : Controller
{
    public async Task<IActionResult> Index(string q)
    {
        var answer = await kernel.InvokePromptAsync(q);
        ViewBag.Answer = answer.ToString();
        var message = await completions.GetChatMessageContentAsync(q);
        return View(model: message.Content);
    }

    public async Task<IActionResult> Tagline(string product)
    {
        var r = await chat.GetResponseAsync(product);
        return Content(r.Text);
    }
}

// Minimal API handlers: Bedrock Converse, Anthropic, a raw write.
public static class AssistantEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/converse", async (string q, AmazonBedrockRuntimeClient bedrock) =>
        {
            var reply = await bedrock.ConverseAsync(new ConverseRequest { ModelId = "anthropic.claude-3-haiku", Messages = [] });
            return reply.Output.Message.Content[0].Text;
        });

        app.MapPost("/claude", async (string q) =>
        {
            AnthropicClient claude = new();
            var message = await claude.Messages.Create(new() { MaxTokens = 512, Model = "claude-sonnet-4-5", Messages = [] });
            return Results.Ok(message.Content);
        });

        app.MapPost("/raw", async (HttpContext context, IChatClient chat) =>
        {
            var r = await chat.GetResponseAsync("hello");
            await context.Response.WriteAsync(r.Text);
        });
    }
}

// A Razor Page and a Blazor component render what they hold.
public class AskModel(IChatClient chat) : PageModel
{
    public string? Answer { get; set; }

    public async Task OnPostAsync(string q)
    {
        var r = await chat.GetResponseAsync(q);
        Answer = r.Text;
    }
}

public class AssistantPanel : ComponentBase
{
    [Inject] public IChatClient Chat { get; set; } = default!;
    private readonly List<string> lines = [];

    private async Task Send(string q)
    {
        var r = await Chat.GetResponseAsync(q);
        lines.Add(r.Text);
    }
}

// The C# copy lexcode writes for a .razor file's @code block (an @inject line becomes a field).
class __RazorCode
{
    IChatClient Chat;
    string? reply;

    async Task Send(string q)
    {
        var r = await Chat.GetResponseAsync(q);
        reply = r.Text;
    }
}

// A SignalR hub answers its caller; a hub context reaches a room from a service.
public class AssistantHub(IChatClient chat) : Hub
{
    public async Task Ask(string q)
    {
        var r = await chat.GetResponseAsync(q);
        await Clients.Caller.SendAsync("reply", r.Text);
    }

    public async Task<string> Quick(string q)
    {
        var r = await chat.GetResponseAsync(q);
        return r.Text;
    }

    // OpenAI through its using line, streamed to the caller.
    public async IAsyncEnumerable<string> Stream(string q)
    {
        var client = new ChatClient("gpt-4o-mini", "key");
        await foreach (var update in client.CompleteChatStreamingAsync(q))
        {
            yield return update.ContentUpdate[0].Text;
        }
    }
}

public class Broadcaster(IHubContext<AssistantHub> hub, IChatCompletionService completions)
{
    public async Task Announce(string room)
    {
        var news = await completions.GetChatMessageContentAsync("Write today's announcement");
        await hub.Clients.Group(room).SendAsync("news", news.Content);
    }
}

// A strongly typed hub calls its clients' own method.
public interface IAssistantClient
{
    Task Reply(string text);
}

public class TypedAssistantHub(IChatClient chat) : Hub<IAssistantClient>
{
    public async Task Ask(string q)
    {
        var r = await chat.GetResponseAsync(q);
        await Clients.Caller.Reply(r.Text);
    }
}
