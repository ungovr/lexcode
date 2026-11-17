// lexcode-expect: 8
// OpenAI's Videos API addresses written the ways apps write them, each sent back as the
// response: an id read from an indexer (a quoted key inside the joined or interpolated address),
// the clip with its variant held in a variable or followed by more of the query, and the
// creation address with a trailing slash or a query.
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class SoraAddressController : ControllerBase
{
    // A remix, the id joined from an indexer.
    public async Task<IActionResult> RemixJoined(HttpClient http, Dictionary<string, string> ids, object body)
    {
        var r = await http.PostAsJsonAsync("https://api.openai.com/v1/videos/" + ids["a"] + "/remix", body);
        return Ok(r);
    }

    // A remix, the id interpolated from an indexer.
    public async Task<IActionResult> RemixInterpolated(HttpClient http, Dictionary<string, string> ids, object body)
    {
        var r = await http.PostAsJsonAsync($"https://api.openai.com/v1/videos/{ids["a"]}/remix", body);
        return Ok(r);
    }

    // The clip, the id joined from an indexer.
    public async Task<IActionResult> ClipJoined(HttpClient http, Dictionary<string, string> ids)
    {
        var r = await http.GetByteArrayAsync("https://api.openai.com/v1/videos/" + ids["a"] + "/content");
        return File(r, "video/mp4");
    }

    // The clip, its variant interpolated.
    public async Task<IActionResult> ClipVariant(HttpClient http, string id, string variant)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content?variant={variant}");
        return File(r, "video/mp4");
    }

    // The clip, its variant joined.
    public async Task<IActionResult> ClipVariantJoined(HttpClient http, string id, string variant)
    {
        var r = await http.GetStreamAsync("https://api.openai.com/v1/videos/" + id + "/content?variant=" + variant);
        return File(r, "video/mp4");
    }

    // The clip, more of the query after the variant.
    public async Task<IActionResult> ClipVariantQuery(HttpClient http, string id)
    {
        var r = await http.GetByteArrayAsync($"https://api.openai.com/v1/videos/{id}/content?variant=video&attempt=1");
        return File(r, "video/mp4");
    }

    // Creation, the address with a trailing slash.
    public async Task<IActionResult> CreateSlash(HttpClient http, object body)
    {
        var r = await http.PostAsJsonAsync("https://api.openai.com/v1/videos/", body);
        return Ok(r);
    }

    // Creation, the address with a query.
    public async Task<IActionResult> CreateQuery(HttpClient http, object body, string team)
    {
        var r = await http.PostAsJsonAsync($"https://api.openai.com/v1/videos?project={team}", body);
        return Ok(r);
    }
}
