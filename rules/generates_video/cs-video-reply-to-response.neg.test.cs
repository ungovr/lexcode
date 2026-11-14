// lexcode-expect: 0
// Footage a person shot, only trimmed; a settings page that shows a video endpoint without
// calling it; an image endpoint in a file that also names the Videos API; an async Bedrock job
// on an embedding model; and an app class that shares the Gen AI SDK's Client short name.
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Demo.Clips;
using FFMpegCore;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Web;

public class ClipController(IAmazonBedrockRuntime bedrock, IHttpClientFactory http) : ControllerBase
{
    // The person's own footage, trimmed to its first ten seconds.
    [HttpPost("trim")]
    public async Task<IActionResult> Trim(string path)
    {
        await FFMpegArguments.FromFileInput(path).OutputToFile("/srv/clips/trimmed.mp4", true, o => o.WithDuration(TimeSpan.FromSeconds(10))).ProcessAsynchronously();
        return PhysicalFile("/srv/clips/trimmed.mp4", "video/mp4");
    }

    // Settings: the endpoint the operator configured, shown, never called.
    [HttpGet("settings")]
    public IActionResult Settings()
    {
        return Ok(new { Endpoint = "https://api.openai.com/v1/videos" });
    }

    // A still for the clip's poster frame, from the Images API.
    [HttpPost("poster")]
    public async Task<IActionResult> Poster(string prompt)
    {
        var client = http.CreateClient();
        var response = await client.PostAsJsonAsync("https://api.openai.com/v1/images/generations", new { prompt });
        return Ok(await response.Content.ReadAsStringAsync());
    }

    // An async Bedrock job that indexes a clip with an embedding model.
    [HttpPost("index")]
    public async Task<IActionResult> Index(string s3Uri)
    {
        var request = new StartAsyncInvokeRequest { ModelId = "twelvelabs.marengo-embed-2-7-v1:0" };
        var job = await bedrock.StartAsyncInvokeAsync(request);
        return Ok(job.InvocationArn);
    }

    // The app's own Client, in Demo.Clips, stitches stock footage: no model.
    [HttpPost("reel")]
    public async Task<IActionResult> Reel(string theme)
    {
        var client = new Client(theme);
        var reel = await client.Models.GenerateVideosAsync(model: "stock", prompt: theme);
        return Ok(reel);
    }
}
