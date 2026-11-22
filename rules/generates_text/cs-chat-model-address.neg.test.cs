// lexcode-expect: 0
// Addresses that are not a hosted text model's generation API, and model addresses that are
// never held or sent: a lookalike host, the address only in a comment or a log or exception
// message, a message constant that quotes it, a local that is only logged, the models list read
// with GetAsync, a const and a GET request message, the stored chat completions listed with a GET
// message, a response retrieved or cancelled by id, embeddings, and Anthropic's token counter.
using System.Net.Http;
using Microsoft.Extensions.Logging;

namespace Demo.Services.Ai;

public class NotGeneration(HttpClient http, ILogger<NotGeneration> logger)
{
    // POST https://api.openai.com/v1/chat/completions is called by the worker, not here.
    private const string LookalikeUrl = "https://api.openai.com.example.net/v1/chat/completions";
    private const string OtherTld = "https://api.deepseek.co/chat/completions";
    private const string StartMessage = "Calling https://api.openai.com/v1/chat/completions";
    private const string ModelsUrl = "https://api.openai.com/v1/models";
    private static readonly string EmbeddingsUrl = "https://api.openai.com/v1/embeddings";
    public static string TokenCountUrl => "https://api.anthropic.com/v1/messages/count_tokens";

    public async Task<string> Models()
    {
        logger.LogInformation("Listing models before POST https://api.openai.com/v1/chat/completions");
        logger.LogDebug("https://api.openai.com/v1/chat/completions");
        var r = await http.GetAsync("https://api.openai.com/v1/models");
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> ModelsConst()
    {
        var r = await http.GetStringAsync(ModelsUrl);
        return r;
    }

    public async Task<string> ModelsMessage()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/models");
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> StoredList()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Retrieve(string id)
    {
        var r = await http.GetAsync($"https://api.openai.com/v1/responses/{id}");
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Cancel(string id)
    {
        var r = await http.PostAsync($"https://api.openai.com/v1/responses/{id}/cancel", null);
        return await r.Content.ReadAsStringAsync();
    }

    public void LogOnly()
    {
        string endpoint = "https://api.openai.com/v1/chat/completions";
        logger.LogWarning("Endpoint {Endpoint} is not configured", endpoint);
        throw new InvalidOperationException("https://api.openai.com/v1/chat/completions is unreachable");
    }

    public async Task<string> Lookalike(HttpContent content)
    {
        var r = await http.PostAsync(LookalikeUrl, content);
        var s = await http.PostAsync(OtherTld, content);
        var t = await http.PostAsync("https://api.openai.community/v1/chat/completions", content);
        return await r.Content.ReadAsStringAsync();
    }
}
