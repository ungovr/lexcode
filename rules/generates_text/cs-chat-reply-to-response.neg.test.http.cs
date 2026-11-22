// lexcode-expect: 0
// Hosted text model addresses that write nothing, each read with HttpClient and sent straight back
// from a controller action: the models list, the stored chat completions listed with a GET request
// message, a response retrieved by id, embeddings, and Anthropic's token counter.
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class HostedReadsController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> Models()
    {
        var r = await http.GetAsync("https://api.openai.com/v1/models");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Stored()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Retrieve(string id)
    {
        var r = await http.GetAsync($"https://api.openai.com/v1/responses/{id}");
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Embeddings(HttpContent body)
    {
        var r = await http.PostAsync("https://api.openai.com/v1/embeddings", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> CountTokens(HttpContent body)
    {
        var r = await http.PostAsync("https://api.anthropic.com/v1/messages/count_tokens", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
