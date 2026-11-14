// lexcode-expect: 0
// Text a model writes that only the team reads, embeddings, text a person wrote, a private
// helper's value, a page model's local, a void action that only logs, and a chat client looked up
// only to report whether one is configured, which model it uses, or to keep it in a component.
// The app's classes that share a model library's short names are in
// cs-chat-reply-to-response.neg.test.samename.cs.
using Markdig;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenAI;

namespace Demo.Web;

// A nightly job summarizes support tickets into the log the support team reads.
public class TicketDigest(IChatClient chat, ILogger<TicketDigest> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var digest = await chat.GetResponseAsync("Summarize today's tickets", cancellationToken: stoppingToken);
        logger.LogInformation("Ticket digest: {Digest}", digest.Text);
        Console.WriteLine(digest.Text);
    }
}

// Embeddings rank catalog items; no model writes anything a person reads.
public class SearchController(IEmbeddingGenerator<string, Embedding<float>> embeddings) : ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search(string q)
    {
        var vector = await embeddings.GenerateVectorAsync(q);
        return Ok(vector.Length);
    }

    // A post a person wrote, only formatted.
    [HttpGet("post")]
    public IActionResult Post(string body)
    {
        return Content(Markdown.ToHtml(body), "text/html");
    }
}

public class DraftController : ControllerBase
{
    // A private helper's value is not the response.
    private async Task<string> Draft(IChatClient chat, string topic)
    {
        var r = await chat.GetResponseAsync(topic);
        return r.Text;
    }
}

// A page model's local is not a property its page renders.
public class DraftModel(IChatClient chat, ILogger<DraftModel> logger) : PageModel
{
    public async Task OnPostAsync(string q)
    {
        string draft;
        var r = await chat.GetResponseAsync(q);
        draft = r.Text;
        logger.LogDebug("draft {Length}", draft.Length);
    }
}

public class AuditController(IChatClient chat, ILogger<AuditController> logger) : ControllerBase
{
    // A one-statement void action: the reply goes to the log, not the response.
    public async Task Audit(string q) { logger.LogInformation("{Reply}", (await chat.GetResponseAsync(q)).Text); }
}

// A feature flag endpoint and the client's metadata: no model output reaches anyone.
public class FlagsController(IServiceProvider sp) : ControllerBase
{
    [HttpGet("ai-enabled")]
    public IActionResult AiEnabled()
    {
        var chat = sp.GetService<IChatClient>();
        return Ok(chat is not null);
    }

    [HttpGet("ai-enabled2")]
    public IActionResult AiEnabled2()
    {
        var chat = sp.GetService<IChatClient>();
        ViewBag.AiAvailable = chat != null;
        return Ok();
    }

    [HttpGet("model-name")]
    public IActionResult ModelName()
    {
        var chat = sp.GetRequiredService<IChatClient>();
        return Ok(chat.GetService<ChatClientMetadata>()?.DefaultModelId);
    }

    [HttpGet("openai-model")]
    public IActionResult OpenAiModel(OpenAIClient openAi)
    {
        var chat = openAi.GetChatClient("gpt-4o");
        return Ok(chat.Model);
    }
}

// A Blazor component that looks the client up and keeps it; it never calls it here.
public class Wiring : ComponentBase
{
    [Inject] public IServiceProvider Services { get; set; } = default!;
    private IChatClient? _chat;
    private IChatClient? _kept;
    private bool _ready;

    protected override void OnInitialized()
    {
        _chat = Services.GetService<IChatClient>();
        _kept = _chat;
        _ready = _chat is not null;
    }
}
