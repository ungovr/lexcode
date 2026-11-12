// lexcode-expect: 0
// Gemini output only the team reads, token counts and embeddings on a Gemini model, a Vertex AI
// prediction that is not a generation, and an app class that shares the Gen AI SDK's short name.
using Demo.Content;
using Google.Cloud.AIPlatform.V1;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Mscc.GenerativeAI;

namespace Demo.Web;

// A nightly job asks Gemini to tag new products; the tags go to the log the merchandisers read.
public class ProductTagger(ILogger<ProductTagger> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var googleAI = new GoogleAI("key");
        var model = googleAI.GenerativeModel(model: "gemini-2.5-flash");
        var tags = await model.GenerateContent("Tag these products");
        logger.LogInformation("tags {Tags}", tags.Text);
    }
}

public class ModelInfoController : ControllerBase
{
    // Counting tokens and making embeddings write nothing a person reads.
    [HttpGet("tokens")]
    public async Task<IActionResult> Tokens(string prompt)
    {
        var googleAI = new GoogleAI("key");
        var model = googleAI.GenerativeModel(model: "gemini-2.5-flash");
        var count = await model.CountTokens(prompt);
        var embedding = await model.EmbedContent(prompt);
        return Ok(count.TotalTokens + embedding.Embedding.Values.Count);
    }

    // A Vertex AI prediction from a tabular model, not a generation.
    [HttpPost("score")]
    public async Task<IActionResult> Score(PredictionServiceClient vertex, PredictRequest request)
    {
        var prediction = await vertex.PredictAsync(request);
        return Ok(prediction.Predictions.Count);
    }

    // The app's own Client, in Demo.Content: it fills a template, no model.
    [HttpGet("page")]
    public async Task<IActionResult> Page(string slug)
    {
        var client = new Client(slug);
        var page = await client.Models.GenerateContentAsync(model: "landing", contents: slug);
        return Content(page);
    }
}
