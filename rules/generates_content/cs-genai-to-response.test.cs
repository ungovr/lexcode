// lexcode-expect: 9
// Gemini output, whose kind the code does not fix, sent back to the person who asked: the Google
// Gen AI SDK through its using line, an alias and target-typed new; Vertex AI typed as a
// primary-constructor parameter and built into a local; and Mscc.GenerativeAI.
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

    // Vertex AI, built into a local: the request carries on to the result.
    [HttpPost("built")]
    public async Task<IActionResult> Built(string prompt)
    {
        var client = await new PredictionServiceClientBuilder { Endpoint = "us-central1-aiplatform.googleapis.com" }.BuildAsync();
        var request = new GenerateContentRequest { Model = "projects/p/locations/us-central1/publishers/google/models/gemini-2.5-flash" };
        var response = await client.GenerateContentAsync(request);
        return Ok(response.Candidates[0].Content.Parts[0].Text);
    }

    // Mscc.GenerativeAI: a model taken from GoogleAI.
    [HttpPost("mscc")]
    public async Task<IActionResult> Mscc(string prompt)
    {
        var googleAI = new GoogleAI("key");
        var model = googleAI.GenerativeModel(model: "gemini-2.5-flash");
        var response = await model.GenerateContent(prompt);
        return Ok(response.Text);
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

        // Constructed with an object initializer; a Vertex request with an empty argument list.
        app.MapPost("/initialized", async (string prompt) =>
        {
            var model = new GenerativeModel { Model = "gemini-2.5-flash" };
            var response = await model.GenerateContent(prompt);
            return Results.Text(response.Text);
        });

        app.MapPost("/vertex", async () =>
        {
            var vertex = PredictionServiceClient.Create();
            var response = await vertex.GenerateContentAsync(new GenerateContentRequest() { Model = "gemini-2.5-pro" });
            return response.Candidates[0].Content.Parts[0].Text;
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
