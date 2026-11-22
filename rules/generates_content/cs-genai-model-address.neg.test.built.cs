// lexcode-expect: 0
// Gemini addresses built the same ways that are not generation, or never sent: a local holding an
// interpolated generation address that is only logged, a joined countTokens address sent, a
// formatted embedContent address sent, a model's metadata joined from the model, a joined address
// whose method is held in a variable, and a const joined from a base that ends in another method.
using System.Net.Http;
using Microsoft.Extensions.Logging;

namespace Demo.Services.Ai;

public class GeminiBuiltReads(HttpClient http, ILogger<GeminiBuiltReads> logger)
{
    private const string ModelsBase = "https://generativelanguage.googleapis.com/v1beta/models/";
    private const string EmbedUrl = ModelsBase + "gemini-embedding-001:embedContent";

    public void LogOnly(string model)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
        logger.LogInformation("Gemini endpoint {Url}", url);
    }

    public async Task<string> Count(HttpContent content, string model)
    {
        var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":countTokens";
        var r = await http.PostAsync(url, content);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Embed(HttpContent content, string model, string key)
    {
        var r = await http.PostAsync(string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:embedContent?key={1}", model, key), content);
        var s = await http.PostAsync(EmbedUrl, content);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Metadata(string model)
    {
        var r = await http.GetAsync("https://generativelanguage.googleapis.com/v1beta/models/" + model);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> MethodInVariable(HttpContent content, string model, string method)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":" + method, content);
        return await r.Content.ReadAsStringAsync();
    }
}
