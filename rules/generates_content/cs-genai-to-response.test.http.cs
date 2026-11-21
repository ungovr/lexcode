// lexcode-expect: 4
// A hosted Gemini model called with HttpClient and no SDK, its reply sent back from a controller
// action: generateContent with an interpolated model and key, streamGenerateContent through a
// POST request message, Vertex AI's regional host interpolated with PostAsJsonAsync, and an
// address held in a const. The last action echoes a request message it never sends, which is no
// reply and does not count.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class HostedGeminiController(HttpClient http) : ControllerBase
{
    private const string FlashUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

    public async Task<IActionResult> Generate(HttpContent body, string model, string key)
    {
        var r = await http.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Stream(HttpContent body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse") { Content = body };
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Vertex(object body, string region, string project, string model)
    {
        var r = await http.PostAsJsonAsync($"https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{model}:generateContent", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Flash(HttpContent body)
    {
        var r = await http.PostAsync(FlashUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public IActionResult Echo()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
        return Ok(request.RequestUri);
    }
}
