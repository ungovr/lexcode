// lexcode-expect: 0
// A request message with a GET method for a generation address, which makes nothing: the stored chat completions listed.
// Each method is HttpMethod.Get, new HttpMethod("GET") or its fully qualified form, and each
// address is written in the message, held in an interpolated local or held in a local const,
// each reply sent back from a controller action.
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class TextGetController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> GetLiteral(string n)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetLocal(string n)
    {
        var url = $"https://api.openai.com/v1/chat/completions?limit={n}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetConst(string n)
    {
        const string address = "https://api.openai.com/v1/chat/completions";
        var request = new HttpRequestMessage(HttpMethod.Get, address);
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetNamedLiteral(string n)
    {
        var request = new HttpRequestMessage(new HttpMethod("GET"), "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetNamedLocal(string n)
    {
        var url = $"https://api.openai.com/v1/chat/completions?limit={n}";
        var request = new HttpRequestMessage(new HttpMethod("GET"), url);
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetNamedConst(string n)
    {
        const string address = "https://api.openai.com/v1/chat/completions";
        var request = new HttpRequestMessage(new HttpMethod("GET"), address);
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetQualifiedLiteral(string n)
    {
        var request = new HttpRequestMessage(new System.Net.Http.HttpMethod("GET"), "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetQualifiedLocal(string n)
    {
        var url = $"https://api.openai.com/v1/chat/completions?limit={n}";
        var request = new HttpRequestMessage(new System.Net.Http.HttpMethod("GET"), url);
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> GetQualifiedConst(string n)
    {
        const string address = "https://api.openai.com/v1/chat/completions";
        var request = new HttpRequestMessage(new System.Net.Http.HttpMethod("GET"), address);
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
