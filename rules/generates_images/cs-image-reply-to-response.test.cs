// lexcode-expect: 10
// Pictures an image model made, sent back to the person who asked: the OpenAI SDK through its
// using line, an alias and target-typed new; Microsoft.Extensions.AI and Semantic Kernel injected;
// Imagen; Bedrock; a minimal API, a Blazor component and a hub.
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Google.GenAI;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel.TextToImage;
using OpenAI.Images;
using Img = OpenAI.Images;

namespace Demo.Web;

public class ArtController(IImageGenerator generator, ITextToImageService textToImage, IAmazonBedrockRuntime bedrock) : ControllerBase
{
    [HttpPost("art")]
    public async Task<IActionResult> Art(string prompt)
    {
        var images = new ImageClient("gpt-image-1", "key");
        GeneratedImage image = await images.GenerateImageAsync(prompt);
        return File(image.ImageBytes.ToArray(), "image/png");
    }

    [HttpPost("aliased")]
    public async Task<IActionResult> Aliased(string prompt)
    {
        Img.ImageClient images = new("dall-e-3", "key");
        var image = await images.GenerateImageAsync(prompt);
        return Ok(image.Value.ImageUri);
    }

    [HttpPost("generator")]
    public async Task<IActionResult> Generator(string prompt)
    {
        var result = await generator.GenerateImagesAsync(prompt);
        return Ok(result.Contents);
    }

    [HttpPost("kernel")]
    public async Task<IActionResult> Kernel(string prompt)
    {
        var url = await textToImage.GenerateImageAsync(prompt, 1024, 1024);
        return Redirect(url);
    }

    [HttpPost("imagen")]
    public async Task<IActionResult> Imagen(string prompt)
    {
        var client = new Client(apiKey: "key");
        var response = await client.Models.GenerateImagesAsync(model: "imagen-4.0-generate-001", prompt: prompt);
        return File(response.GeneratedImages[0].Image.ImageBytes, "image/png");
    }

    [HttpPost("canvas")]
    public async Task<IActionResult> Canvas(string prompt)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        var response = await bedrock.InvokeModelAsync(request);
        return File(response.Body, "application/json");
    }

    // The same request with an empty argument list before its initializer.
    [HttpPost("stability")]
    public async Task<IActionResult> Stability(string prompt)
    {
        var response = await bedrock.InvokeModelAsync(new InvokeModelRequest() { ModelId = "stability.sd3-5-large-v1:0", ContentType = "application/json" });
        return File(response.Body, "application/json");
    }
}

public static class ArtEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/sticker", async (string prompt, ImageClient images) =>
        {
            var image = await images.GenerateImageAsync(prompt);
            return Results.File(image.Value.ImageBytes.ToArray(), "image/png");
        });
    }
}

public class AvatarPicker : ComponentBase
{
    [Inject] public IImageGenerator Generator { get; set; } = default!;
    private object? avatar;

    private async Task Make(string prompt)
    {
        var result = await Generator.GenerateImagesAsync(prompt);
        avatar = result.Contents[0];
    }
}

public class ArtHub(ITextToImageService painter) : Hub
{
    public async Task Paint(string prompt)
    {
        var url = await painter.GenerateImageAsync(prompt, 512, 512);
        await Clients.Caller.SendAsync("painted", url);
    }
}
