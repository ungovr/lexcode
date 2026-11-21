// lexcode-expect: 10
// A hosted text model's address built by interpolation, concatenation or string.Format, and held
// in a const, a field, a property or a local (#13205 B1). Members count where they are declared: a
// const joined from a base const, a static field joined with an API version in its query, and an
// expression-bodied property formatted with a query value. A local counts where it is sent: an
// interpolated address with a query value posted, an address joined from a base const and a path
// handed to a request message, and a formatted one posted as JSON. An address built at the call
// counts there: two literals joined, a query value joined, and a formatted query; and the joined
// const sent.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Services.Ai;

public class TextBuilt(HttpClient http)
{
    private const string ApiBase = "https://api.openai.com/v1";
    private const string ChatUrl = ApiBase + "/chat/completions";
    public static string ApiVersion = "2024-10-01";
    private static readonly string VersionedUrl = "https://api.deepseek.com/chat/completions?api-version=" + ApiVersion;
    public static string FormattedUrl => string.Format("https://api.anthropic.com/v1/messages?beta={0}", ApiVersion);

    public async Task<string> Interpolated(HttpContent content, string trace)
    {
        var url = $"https://api.mistral.ai/v1/chat/completions?trace={trace}";
        var r = await http.PostAsync(url, content);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Joined(HttpContent content)
    {
        string url = ApiBase + "/responses";
        var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Formatted(object body, string trace)
    {
        var url = string.Format("https://api.groq.com/openai/v1/chat/completions?trace={0}", trace);
        var r = await http.PostAsJsonAsync(url, body);
        return await r.Content.ReadAsStringAsync();
    }

    public Task<HttpResponseMessage> Literals(HttpContent content) =>
        http.PostAsync("https://api.openai.com/v1" + "/chat/completions", content);

    public Task<HttpResponseMessage> QueryJoined(HttpContent content, string v) =>
        http.PostAsync("https://api.openai.com/v1/chat/completions?api-version=" + v, content);

    public Task<HttpResponseMessage> QueryFormatted(HttpContent content, string v) =>
        http.PostAsync(string.Format("https://api.anthropic.com/v1/messages?beta={0}", v), content);

    public Task<HttpResponseMessage> Chat(HttpContent content) => http.PostAsync(ChatUrl, content);
}
