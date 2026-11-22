// lexcode-expect: 1
// Where a model's reply reaches the response and where it does not (#13205 review A5). It counts
// once: an action whose whole body is one try statement that returns the reply from inside the try.
// It does not count (a positive fixture, so the address signal rule may match the same calls): an
// action whose whole body is one try statement, which stores the reply and returns no content (the
// try as a whole is not the action's value), the same through the Google Gen AI SDK, an action that
// returns only the status of the model's HTTP response (its code, whether it succeeded, its reason
// phrase), and an action whose body is one using or if statement that stores the reply.
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;
using Google.GenAI;

namespace Demo.Generated;

public interface IReplyStore
{
    Task SaveAsync(string text);
}

[ApiController]
public class StoredReplyController(HttpClient http, Google.GenAI.Client client, IReplyStore db) : ControllerBase
{
    [HttpPost("returned")]
    public async Task<IActionResult> Returned(HttpContent body)
    {
        try
        {
            var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", body);
            return Ok(await r.Content.ReadAsStringAsync());
        }
        catch (HttpRequestException)
        {
            return StatusCode(502);
        }
    }

    [HttpPost("http")]
    public async Task<IActionResult> Stored(HttpContent body)
    {
        try
        {
            var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", body);
            await db.SaveAsync(await r.Content.ReadAsStringAsync());
            return NoContent();
        }
        catch (HttpRequestException)
        {
            return StatusCode(502);
        }
    }

    [HttpPost("sdk")]
    public async Task<IActionResult> StoredSdk(string prompt)
    {
        try
        {
            var r = await client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: prompt);
            await db.SaveAsync(r.Text);
            return NoContent();
        }
        catch (Exception)
        {
            return StatusCode(500);
        }
    }

    [HttpPost("status")]
    public async Task<IActionResult> Status(HttpContent body)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", body);
        return Ok(r.StatusCode);
    }

    [HttpPost("ok")]
    public async Task<IActionResult> Succeeded(HttpContent body)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", body);
        return Ok(new Status { Succeeded = r.IsSuccessStatusCode, Reason = r.ReasonPhrase });
    }

    [HttpPost("using")]
    public async Task<IActionResult> StoredUsing(HttpContent body)
    {
        using (var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", body))
        {
            await db.SaveAsync(await r.Content.ReadAsStringAsync());
            return NoContent();
        }
    }

    [HttpPost("if")]
    public async Task<IActionResult> StoredIf(HttpContent body, bool keep)
    {
        if (keep)
        {
            var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", body);
            await db.SaveAsync(await r.Content.ReadAsStringAsync());
            return NoContent();
        }
    }
}

public class Status
{
    public bool Succeeded { get; set; }
    public string? Reason { get; set; }
}
