// lexcode-expect: 0
// Text a model writes that only the team reads, embeddings, text a person wrote, a private
// helper's value, and a page model's local. The app's classes that share a model library's short
// names are in cs-chat-reply-to-response.neg.test.samename.cs.
using Markdig;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

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
