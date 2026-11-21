// lexcode-expect: 0
// Text model addresses built the same ways that are not generation, or never sent: a local holding
// an interpolated chat address that is only logged, a response read by id joined from the
// Responses API's address and sent, the same formatted, a chat address with more path joined
// after it, a const joined from a base and the models path, and embeddings joined from a base.
using System.Net.Http;
using Microsoft.Extensions.Logging;

namespace Demo.Services.Ai;

public class TextBuiltReads(HttpClient http, ILogger<TextBuiltReads> logger)
{
    private const string ApiBase = "https://api.openai.com/v1";
    private const string ModelsUrl = ApiBase + "/models";

    public void LogOnly(string trace)
    {
        var url = $"https://api.openai.com/v1/chat/completions?trace={trace}";
        logger.LogInformation("Chat endpoint {Url}", url);
    }

    public async Task<string> ById(HttpContent content, string id)
    {
        var url = "https://api.openai.com/v1/responses/" + id + "/cancel";
        var r = await http.PostAsync(url, content);
        var s = await http.PostAsync(string.Format("https://api.openai.com/v1/responses/{0}/cancel", id), content);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> MorePath(HttpContent content, string id)
    {
        var r = await http.PostAsync("https://api.openai.com/v1/chat/completions/" + id, content);
        var e = await http.PostAsync(ApiBase + "/embeddings", content);
        var m = await http.PostAsync(ModelsUrl, content);
        return await r.Content.ReadAsStringAsync();
    }
}
