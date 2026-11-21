// lexcode-expect: 0
// Text model addresses built the same ways that write nothing, each read and sent straight back
// from a controller action: a response cancelled by an id joined into the Responses API's address,
// embeddings joined from a base const, the models list formatted, and a local holding a chat
// address that is returned unsent.
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class BuiltChatReadsController(HttpClient http) : ControllerBase
{
    private const string ApiBase = "https://api.openai.com/v1";

    public async Task<IActionResult> Cancel(string id)
    {
        var url = "https://api.openai.com/v1/responses/" + id + "/cancel";
        var r = await http.PostAsync(url, null);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Embeddings(HttpContent body)
    {
        var r = await http.PostAsync(ApiBase + "/embeddings", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Models(string v)
    {
        var r = await http.GetAsync(string.Format("https://api.openai.com/v1/models?v={0}", v));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public IActionResult Endpoint(string trace)
    {
        var url = $"https://api.openai.com/v1/chat/completions?trace={trace}";
        return Ok(url);
    }
}
