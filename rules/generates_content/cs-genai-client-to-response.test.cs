// lexcode-expect: 3
// A Gemini model or request whose client the engine cannot type, followed to the response: a
// Vertex AI request on a client built with its builder, a request with an empty argument list on
// a client from the static factory, and an Mscc.GenerativeAI model taken from GoogleAI.
using Google.Cloud.AIPlatform.V1;
using Microsoft.AspNetCore.Mvc;
using Mscc.GenerativeAI;

namespace Demo.Web;

public class StudioController : ControllerBase
{
    [HttpPost("built")]
    public async Task<IActionResult> Built(string prompt)
    {
        var client = await new PredictionServiceClientBuilder { Endpoint = "us-central1-aiplatform.googleapis.com" }.BuildAsync();
        var request = new GenerateContentRequest { Model = "projects/p/locations/us-central1/publishers/google/models/gemini-2.5-flash" };
        var response = await client.GenerateContentAsync(request);
        return Ok(response.Candidates[0].Content.Parts[0].Text);
    }

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
        app.MapPost("/vertex", async () =>
        {
            var vertex = PredictionServiceClient.Create();
            var response = await vertex.GenerateContentAsync(new GenerateContentRequest() { Model = "gemini-2.5-pro" });
            return response.Candidates[0].Content.Parts[0].Text;
        });
    }
}
