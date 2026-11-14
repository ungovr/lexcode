// lexcode-expect: 22
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Amazon.BedrockRuntime.Model;
using Google.GenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel.TextToImage;
using OpenAI.Images;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.Images.ImageClient $C).GenerateImage(...)
    public async Task<IActionResult> Case1(ImageClient client)
    {
        var r = await client.GenerateImage("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageAsync(...)
    public async Task<IActionResult> Case2(ImageClient client)
    {
        var r = await client.GenerateImageAsync("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImages(...)
    public async Task<IActionResult> Case3(ImageClient client)
    {
        var r = await client.GenerateImages("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImagesAsync(...)
    public async Task<IActionResult> Case4(ImageClient client)
    {
        var r = await client.GenerateImagesAsync("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageEdit(...)
    public async Task<IActionResult> Case5(ImageClient client)
    {
        var r = await client.GenerateImageEdit("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageEditAsync(...)
    public async Task<IActionResult> Case6(ImageClient client)
    {
        var r = await client.GenerateImageEditAsync("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageEdits(...)
    public async Task<IActionResult> Case7(ImageClient client)
    {
        var r = await client.GenerateImageEdits("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageEditsAsync(...)
    public async Task<IActionResult> Case8(ImageClient client)
    {
        var r = await client.GenerateImageEditsAsync("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageVariation(...)
    public async Task<IActionResult> Case9(ImageClient client)
    {
        var r = await client.GenerateImageVariation("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageVariationAsync(...)
    public async Task<IActionResult> Case10(ImageClient client)
    {
        var r = await client.GenerateImageVariationAsync("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageVariations(...)
    public async Task<IActionResult> Case11(ImageClient client)
    {
        var r = await client.GenerateImageVariations("q");
        return Ok(r);
    }

    // (OpenAI.Images.ImageClient $C).GenerateImageVariationsAsync(...)
    public async Task<IActionResult> Case12(ImageClient client)
    {
        var r = await client.GenerateImageVariationsAsync("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IImageGenerator $C).GenerateAsync(...)
    public async Task<IActionResult> Case13(IImageGenerator client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IImageGenerator $C).GenerateImagesAsync(...)
    public async Task<IActionResult> Case14(IImageGenerator client)
    {
        var r = await client.GenerateImagesAsync("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IImageGenerator $C).EditImageAsync(...)
    public async Task<IActionResult> Case15(IImageGenerator client)
    {
        var r = await client.EditImageAsync("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IImageGenerator $C).EditImagesAsync(...)
    public async Task<IActionResult> Case16(IImageGenerator client)
    {
        var r = await client.EditImagesAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextToImage.ITextToImageService $C).GenerateImageAsync(...)
    public async Task<IActionResult> Case17(ITextToImageService client)
    {
        var r = await client.GenerateImageAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextToImage.ITextToImageService $C).GetImageContentsAsync(...)
    public async Task<IActionResult> Case18(ITextToImageService client)
    {
        var r = await client.GetImageContentsAsync("q");
        return Ok(r);
    }

    // (Google.GenAI.Client $C).Models.GenerateImagesAsync(...)
    public async Task<IActionResult> Case19(Client client)
    {
        var r = await client.Models.GenerateImagesAsync(model: "imagen-4.0-generate-001", prompt: "q");
        return Ok(r);
    }

    // (Google.GenAI.Client $C).Models.EditImageAsync(...)
    public async Task<IActionResult> Case20(Client client)
    {
        var r = await client.Models.EditImageAsync(model: "imagen-3.0-capability-001", prompt: "q");
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.InvokeModelRequest { ModelId = ... }
    public async Task<IActionResult> Case21(IRuntimeClient runtime)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        var r = await runtime.InvokeModelAsync(request);
        return Ok(r);
    }

    // Amazon.BedrockRuntime.Model.InvokeModelRequest declared with target-typed new()
    public async Task<IActionResult> Case22(IRuntimeClient runtime)
    {
        InvokeModelRequest request = new() { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        var r = await runtime.InvokeModelAsync(request);
        return Ok(r);
    }
}
