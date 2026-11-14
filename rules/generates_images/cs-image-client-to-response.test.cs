// lexcode-expect: 3
// An image client taken into a local, where the engine cannot type it, and followed to the
// response: from the Azure OpenAI and OpenAI clients, and a text-to-image service from the kernel
// in a hub.
using Azure;
using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.TextToImage;
using OpenAI;

namespace Demo.Web;

public class StudioController(OpenAIClient openAi) : ControllerBase
{
    [HttpPost("azure")]
    public async Task<IActionResult> Azure(string prompt)
    {
        var azure = new AzureOpenAIClient(new Uri("https://example.openai.azure.com"), new AzureKeyCredential("key"));
        var images = azure.GetImageClient("dall-e-3");
        var image = await images.GenerateImageAsync(prompt);
        return Ok(image.Value.ImageUri);
    }

    [HttpPost("openai")]
    public async Task<IActionResult> FromOpenAi(string prompt)
    {
        var images = openAi.GetImageClient("gpt-image-1");
        var image = await images.GenerateImageAsync(prompt);
        return File(image.Value.ImageBytes.ToArray(), "image/png");
    }
}

public class ArtHub(Kernel kernel) : Hub
{
    public async Task Paint(string prompt)
    {
        var painter = kernel.GetRequiredService<ITextToImageService>();
        var url = await painter.GenerateImageAsync(prompt, 512, 512);
        await Clients.Caller.SendAsync("painted", url);
    }
}
