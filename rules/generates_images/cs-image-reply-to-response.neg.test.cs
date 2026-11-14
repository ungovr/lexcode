// lexcode-expect: 0
// A photo a person uploaded, only resized; a Bedrock text model; generated art only the team
// sees in the log; the configured image model; and an app class that shares the OpenAI SDK's
// ImageClient short name.
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Demo.Charts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OpenAI;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace Demo.Web;

public class PhotoController(IAmazonBedrockRuntime bedrock, ILogger<PhotoController> logger) : ControllerBase
{
    // The person's own photo, resized to a thumbnail.
    [HttpPost("thumbnail")]
    public async Task<IActionResult> Thumbnail(IFormFile upload)
    {
        using var image = await Image.LoadAsync(upload.OpenReadStream());
        image.Mutate(x => x.Resize(200, 200));
        var output = new MemoryStream();
        await image.SaveAsPngAsync(output);
        return File(output.ToArray(), "image/png");
    }

    // A text model on Bedrock writes a caption; that is text, not a picture.
    [HttpPost("caption")]
    public async Task<IActionResult> Caption(string q)
    {
        var request = new InvokeModelRequest { ModelId = "amazon.titan-text-express-v1", ContentType = "application/json" };
        var response = await bedrock.InvokeModelAsync(request);
        return File(response.Body, "application/json");
    }

    // The app's own ImageClient, in Demo.Charts, draws a chart from sales figures: no model.
    [HttpGet("chart")]
    public async Task<IActionResult> Chart(int year)
    {
        var charts = new ImageClient("sales");
        var png = await charts.GenerateImageAsync($"sales {year}");
        return File(png, "image/png");
    }

    // A design team's moodboard: generated, then only logged for the team.
    [HttpPost("moodboard")]
    public async Task Moodboard(OpenAI.Images.ImageClient images)
    {
        var art = await images.GenerateImageAsync("autumn palette");
        logger.LogInformation("moodboard {Uri}", art.Value.ImageUri);
    }

    // Which image model is configured; nothing is drawn.
    [HttpGet("image-model")]
    public IActionResult ImageModel(OpenAIClient openAi)
    {
        var images = openAi.GetImageClient("dall-e-3");
        return Ok(images.Model);
    }
}
