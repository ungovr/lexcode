// lexcode-expect: 0
// Gemini addresses that generate nothing, each read with HttpClient and sent straight back from a
// controller action: the model list, a model's metadata, token counting and embeddings.
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class HostedGeminiReadsController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> Models()
    {
        var r = await http.GetAsync("https://generativelanguage.googleapis.com/v1beta/models");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Metadata(string model)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://generativelanguage.googleapis.com/v1beta/models/{model}");
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Count(HttpContent body)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Embed(HttpContent body)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
