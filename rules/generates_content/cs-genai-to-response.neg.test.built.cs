// lexcode-expect: 0
// Gemini addresses built the same ways that write nothing, each read and sent straight back from a
// controller action: countTokens joined with the model, embedContent formatted, and a model's
// metadata from a local; and a local holding a generation address that is returned unsent.
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class BuiltGeminiReadsController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> Count(HttpContent body, string model)
    {
        var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":countTokens";
        var r = await http.PostAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Embed(HttpContent body, string model)
    {
        var r = await http.PostAsync(string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:embedContent", model), body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Metadata(string model)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}";
        var r = await http.GetAsync(url);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public IActionResult Endpoint(string model)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
        return Ok(url);
    }
}
