// lexcode-expect: 6
// Gemini output, whose kind the code does not fix, sent back to the person who asked: the Google
// Gen AI SDK through its using line, an alias and target-typed new; Vertex AI typed as a
// primary-constructor parameter; and an Mscc.GenerativeAI model constructed into a local, with
// arguments and with an initializer (the engine types a local built with new).
using Google.Cloud.AIPlatform.V1;
using Google.GenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Mscc.GenerativeAI;
using GenAI = Google.GenAI;

namespace Demo.Web;

public class StudioController(PredictionServiceClient vertex) : ControllerBase
{
    [HttpPost("create")]
    public async Task<IActionResult> Create(string prompt)
    {
        var client = new Client(apiKey: "key");
        var response = await client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: prompt);
        return Ok(response.Candidates[0].Content.Parts[0].Text);
    }

    [HttpPost("aliased")]
    public async Task<IActionResult> Aliased(string prompt)
    {
        GenAI.Client client = new(apiKey: "key");
        var response = await client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: prompt);
        return Ok(response.Candidates[0].Content);
    }

    // Vertex AI, injected.
    [HttpPost("vertex")]
    public async Task<IActionResult> Vertex(GenerateContentRequest request)
    {
        var response = await vertex.GenerateContentAsync(request);
        return Ok(response.Candidates[0].Content.Parts[0].Text);
    }
}

public static class StudioEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/mscc", async (string prompt) =>
        {
            var model = new GenerativeModel(apiKey: "key", model: "gemini-2.5-flash");
            var response = await model.GenerateContent(prompt);
            return Results.Text(response.Text);
        });

        // Constructed with an object initializer.
        app.MapPost("/initialized", async (string prompt) =>
        {
            var model = new GenerativeModel { Model = "gemini-2.5-flash" };
            var response = await model.GenerateContent(prompt);
            return Results.Text(response.Text);
        });
    }
}

public class StudioHub : Hub
{
    public async Task Create(string prompt)
    {
        var client = new Client(apiKey: "key");
        var response = await client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: prompt);
        await Clients.Caller.SendAsync("created", response.Candidates[0].Content);
    }
}
