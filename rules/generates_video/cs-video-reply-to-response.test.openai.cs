// lexcode-expect: 9
// OpenAI's Videos API addresses that make or return a clip, each sent back as the response: a
// remix of a finished video (a new generation), the clip downloaded with its variant named, the
// download address built by concatenation, the download and the creation through request
// messages, and an edit or an extension of a finished video (each makes a new clip).
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class SoraController : ControllerBase
{
    // POST /v1/videos/{id}/remix makes a new video from a finished one.
    public async Task<IActionResult> Remix(HttpClient http, string id, string prompt)
    {
        var r = await http.PostAsJsonAsync($"https://api.openai.com/v1/videos/{id}/remix", new { prompt });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // The clip, with its variant named.
    public async Task<IActionResult> Clip(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content?variant=video");
        return File(r, "video/mp4");
    }

    // The clip, its address built by concatenation.
    public async Task<IActionResult> Joined(HttpClient http, string id)
    {
        var r = await http.GetStreamAsync("https://api.openai.com/v1/videos/" + id + "/content");
        return File(r, "video/mp4");
    }

    // The clip through a request message, sent with GET.
    public async Task<IActionResult> ClipMessage(HttpClient http, string id)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.openai.com/v1/videos/{id}/content");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // The clip through a request message with named arguments, sent with GET.
    public async Task<IActionResult> ClipMessageNamed(HttpClient http, string id)
    {
        HttpRequestMessage request = new(requestUri: $"https://api.openai.com/v1/videos/{id}/content", method: HttpMethod.Get);
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // Creation through a request message with the method written fully qualified.
    public async Task<IActionResult> Create(HttpClient http)
    {
        var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, "https://api.openai.com/v1/videos");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // POST /v1/videos/edits makes a new clip from a finished one.
    public async Task<IActionResult> Edit(HttpClient http, object body)
    {
        var r = await http.PostAsJsonAsync("https://api.openai.com/v1/videos/edits", body);
        return Ok(r);
    }

    // POST /v1/videos/extensions makes a longer clip from a finished one.
    public async Task<IActionResult> Extend(HttpClient http, object body)
    {
        var r = await http.PostAsJsonAsync(requestUri: "https://api.openai.com/v1/videos/extensions", value: body);
        return Ok(r);
    }

    // An extension through a request message.
    public async Task<IActionResult> ExtendMessage(HttpClient http)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/videos/extensions");
        var r = await http.SendAsync(request);
        return Ok(r);
    }
}
