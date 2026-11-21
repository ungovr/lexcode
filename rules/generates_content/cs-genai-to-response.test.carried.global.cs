// lexcode-expect: 4
// The carried-value request messages in a file with no `using System.Net.Http;` (the SDK imports it
// implicitly), so only the short-form patterns read them: each joined const of the evidence carried
// fixture put in a short and a target-typed request message, each reply sent back from a controller
// action.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Carried;

public class GeminiCarriedGlobalController(HttpClient http) : ControllerBase
{
    private const string Base0 = "https://generativelanguage.googleapis.com";
    private const string Base1 = "https://us-central1-aiplatform.googleapis.com";
    private const string FlashQuery = Base0 + "/v1beta/models/gemini-2.5-flash:generateContent?key=k";
    private const string Vertex = Base1 + "/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent";

    public async Task<IActionResult> FlashQueryMessage()
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, FlashQuery));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> FlashQueryTargetTyped()
    {
        HttpRequestMessage m = new(HttpMethod.Post, FlashQuery);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexMessage()
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Vertex));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> VertexTargetTyped()
    {
        HttpRequestMessage m = new(HttpMethod.Post, Vertex);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
