// lexcode-expect: 0
// The Videos API's reads, each sent straight back as the response: listing the account's videos,
// a job's status, polled with a GET or with a request message, and a character asset made for
// later prompts. None makes or returns a clip; only creating one (POST /v1/videos, a remix, an
// edit or an extension) and downloading it (/content) count.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class VideoJobsController : ControllerBase
{
    // GET /v1/videos lists the account's videos.
    public async Task<IActionResult> List(HttpClient http)
    {
        var r = await http.GetAsync("https://api.openai.com/v1/videos");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // The same list, paged.
    public async Task<IActionResult> Page(HttpClient http, string after)
    {
        var r = await http.GetAsync($"https://api.openai.com/v1/videos?limit=20&after={after}");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // GET /v1/videos/{id} reads a job's status.
    public async Task<IActionResult> Status(HttpClient http, string id)
    {
        var r = await http.GetAsync($"https://api.openai.com/v1/videos/{id}");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // The status, with the address as a named argument.
    public async Task<IActionResult> StatusNamed(HttpClient http, string id)
    {
        var r = await http.GetAsync(requestUri: $"https://api.openai.com/v1/videos/{id}");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // The status, its address built by concatenation.
    public async Task<IActionResult> StatusJoined(HttpClient http, string id)
    {
        var r = await http.GetAsync("https://api.openai.com/v1/videos/" + id);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // The status through a request message, sent.
    public async Task<IActionResult> StatusMessage(HttpClient http, string id)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.openai.com/v1/videos/{id}");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // The list through a request message, sent.
    public async Task<IActionResult> ListMessage(HttpClient http)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/videos");
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // The list through a request message with named arguments, sent.
    public async Task<IActionResult> ListMessageNamed(HttpClient http)
    {
        HttpRequestMessage request = new(requestUri: "https://api.openai.com/v1/videos", method: System.Net.Http.HttpMethod.Get);
        var r = await http.SendAsync(request);
        return Ok(r);
    }

    // A thumbnail of a finished job, a still, not the clip.
    public async Task<IActionResult> Thumbnail(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content?variant=thumbnail");
        return File(r, "image/webp");
    }

    // POST /v1/videos/characters makes a character asset for later prompts, not a clip.
    public async Task<IActionResult> Character(HttpClient http, object body)
    {
        var r = await http.PostAsJsonAsync("https://api.openai.com/v1/videos/characters", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // A job's status, the id joined from an indexer.
    public async Task<IActionResult> StatusIndexed(HttpClient http, System.Collections.Generic.Dictionary<string, string> ids)
    {
        var r = await http.GetAsync("https://api.openai.com/v1/videos/" + ids["a"]);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    // The spritesheet of a finished job, the id joined from an indexer: a still, not the clip.
    public async Task<IActionResult> Spritesheet(HttpClient http, System.Collections.Generic.Dictionary<string, string> ids)
    {
        var r = await http.GetByteArrayAsync("https://api.openai.com/v1/videos/" + ids["a"] + "/content?variant=spritesheet");
        return File(r, "image/jpeg");
    }

    // The thumbnail, more of the query after the variant.
    public async Task<IActionResult> ThumbnailQuery(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content?variant=thumbnail&attempt=1");
        return File(r, "image/webp");
    }

    // The list through a request message whose method is built from its name.
    public async Task<IActionResult> ListMessageBuilt(HttpClient http)
    {
        var request = new HttpRequestMessage(new HttpMethod("GET"), "https://api.openai.com/v1/videos");
        var r = await http.SendAsync(request);
        return Ok(r);
    }
}
