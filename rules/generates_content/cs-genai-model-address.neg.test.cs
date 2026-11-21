// lexcode-expect: 0
// Gemini addresses that do not generate, and generation addresses that are never held or sent: a
// lookalike host, the address only in a comment or a log or exception message, a message constant
// that quotes it, a local that is only logged, the model list read with GetAsync, a const and a GET
// request message, a model's metadata, token counting and embeddings.
using System.Net.Http;
using Microsoft.Extensions.Logging;

namespace Demo.Services.Ai;

public class NotGeneration(HttpClient http, ILogger<NotGeneration> logger)
{
    // POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
    private const string LookalikeUrl = "https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent";
    private const string StartMessage = "Calling https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private const string ModelsUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    private static readonly string CountUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens";
    public static string EmbedUrl => "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    public async Task<string> Models()
    {
        logger.LogInformation("Listing models before https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
        var r = await http.GetAsync("https://generativelanguage.googleapis.com/v1beta/models");
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> ModelsConst() => await http.GetStringAsync(ModelsUrl);

    public async Task<string> ModelsMessage()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://generativelanguage.googleapis.com/v1beta/models?pageSize=50");
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Metadata(string model)
    {
        var r = await http.GetAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}");
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Count(HttpContent content)
    {
        var r = await http.PostAsync(CountUrl, content);
        var e = await http.PostAsync(EmbedUrl, content);
        return await r.Content.ReadAsStringAsync();
    }

    public void LogOnly()
    {
        string endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        logger.LogWarning("Endpoint {Endpoint} is not configured", endpoint);
        throw new InvalidOperationException("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent is unreachable");
    }

    public async Task<string> Lookalike(HttpContent content)
    {
        var r = await http.PostAsync(LookalikeUrl, content);
        return await r.Content.ReadAsStringAsync();
    }
}
