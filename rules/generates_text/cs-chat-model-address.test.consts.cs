// lexcode-expect: 6
// A hosted text model's address held in a const, a static readonly field, an instance field
// (a verbatim string) and a local, and sent with HttpClient. Each declaration counts, and so does
// each send whose address the engine follows from a const, a readonly field or a local in the
// same file: PostAsync with the const, a POST request message with the static field, and
// PostAsJsonAsync with the local.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Services.Ai;

public class CompletionClient
{
    private const string GroqUrl = "https://api.groq.com/openai/v1/chat/completions";
    private static readonly string LegacyUrl = "https://api.openai.com/v1/completions";
    private readonly string _chatUrl = @"https://api.openai.com/v1/chat/completions";
    private readonly HttpClient _http;

    public CompletionClient(HttpClient http) => _http = http;

    public async Task<string> Groq(HttpContent content)
    {
        var response = await _http.PostAsync(GroqUrl, content);
        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string> Legacy(HttpContent content)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, LegacyUrl) { Content = content };
        var response = await _http.SendAsync(request);
        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string> DeepSeek(object body)
    {
        var url = "https://api.deepseek.com/v1/chat/completions";
        var response = await _http.PostAsJsonAsync(url, body);
        return await response.Content.ReadAsStringAsync();
    }
}
