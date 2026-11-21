// lexcode-expect: 25
// Generation addresses the engine carries to the call (#13205 review A3), each joined from a base
// const (a value only the carried-value branch reads, since no literal holds it whole): Gemini's
// generateContent with a key and Vertex AI's streamGenerateContent held in consts, and Gemini's
// streamGenerateContent with alt=sse held in a local, each sent in every shape the carried-value
// branch reads (posted, posted as JSON plain and generic, a short, qualified and target-typed
// request message, and a base address). Each const also counts where it is declared.
// Each const has an expression-bodied property twin joined the same way.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Carried;

public class GeminiCarried(HttpClient http)
{
    private const string Base0 = "https://generativelanguage.googleapis.com";
    private const string Base1 = "https://us-central1-aiplatform.googleapis.com";
    private const string FlashQuery = Base0 + "/v1beta/models/gemini-2.5-flash:generateContent?key=k";
    private const string Vertex = Base1 + "/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent";
    public static string FlashQueryProperty => Base0 + "/v1beta/models/gemini-2.5-flash:generateContent?key=k";
    public static string VertexProperty => Base1 + "/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent";

    public async Task FlashQuerySends(HttpContent content)
    {
        await http.PostAsync(FlashQuery, content);
        await http.PostAsJsonAsync(FlashQuery, content);
        await http.PostAsJsonAsync<object>(FlashQuery, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, FlashQuery));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, FlashQuery));
        HttpRequestMessage m = new(HttpMethod.Post, FlashQuery);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(FlashQuery);
    }

    public async Task VertexSends(HttpContent content)
    {
        await http.PostAsync(Vertex, content);
        await http.PostAsJsonAsync(Vertex, content);
        await http.PostAsJsonAsync<object>(Vertex, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Vertex));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Vertex));
        HttpRequestMessage m = new(HttpMethod.Post, Vertex);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Vertex);
    }

    public async Task StreamSends(HttpContent content)
    {
        var streamPost = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        await http.PostAsync(streamPost, content);
        var streamJson = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        await http.PostAsJsonAsync(streamJson, content);
        var streamJsonT = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        await http.PostAsJsonAsync<object>(streamJsonT, content);
        var streamMessage = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, streamMessage));
        var streamQualified = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, streamQualified));
        var streamTargetTyped = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        HttpRequestMessage m = new(HttpMethod.Post, streamTargetTyped);
        await http.SendAsync(m);
        var streamUri = Base0 + "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
        http.BaseAddress = new Uri(streamUri);
    }
}
