// lexcode-expect: 0
// Addresses next to the text generation ones, carried to the call (#13205 review A3), each joined
// from a base const (a value only the carried-value branch reads, since no literal holds it whole):
// embeddings, message batches and more path after the chat completions address held in consts, and
// the models list held in a local, each sent in every shape the carried-value branch reads.
// Each const has an expression-bodied property twin joined the same way.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Carried;

public class TextCarriedReads(HttpClient http)
{
    private const string Base0 = "https://api.openai.com";
    private const string Base1 = "https://api.anthropic.com";
    private const string Embeddings = Base0 + "/v1/embeddings";
    private const string Batches = Base1 + "/v1/messages/batches";
    private const string ChatMore = Base0 + "/v1/chat/completions/abc/messages";
    public static string EmbeddingsProperty => Base0 + "/v1/embeddings";
    public static string BatchesProperty => Base1 + "/v1/messages/batches";
    public static string ChatMoreProperty => Base0 + "/v1/chat/completions/abc/messages";

    public async Task EmbeddingsSends(HttpContent content)
    {
        await http.PostAsync(Embeddings, content);
        await http.PostAsJsonAsync(Embeddings, content);
        await http.PostAsJsonAsync<object>(Embeddings, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Embeddings));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Embeddings));
        HttpRequestMessage m = new(HttpMethod.Post, Embeddings);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Embeddings);
    }

    public async Task BatchesSends(HttpContent content)
    {
        await http.PostAsync(Batches, content);
        await http.PostAsJsonAsync(Batches, content);
        await http.PostAsJsonAsync<object>(Batches, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Batches));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Batches));
        HttpRequestMessage m = new(HttpMethod.Post, Batches);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Batches);
    }

    public async Task ChatMoreSends(HttpContent content)
    {
        await http.PostAsync(ChatMore, content);
        await http.PostAsJsonAsync(ChatMore, content);
        await http.PostAsJsonAsync<object>(ChatMore, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, ChatMore));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, ChatMore));
        HttpRequestMessage m = new(HttpMethod.Post, ChatMore);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(ChatMore);
    }

    public async Task ModelsSends(HttpContent content)
    {
        var modelsPost = Base0 + "/v1/models";
        await http.PostAsync(modelsPost, content);
        var modelsJson = Base0 + "/v1/models";
        await http.PostAsJsonAsync(modelsJson, content);
        var modelsJsonT = Base0 + "/v1/models";
        await http.PostAsJsonAsync<object>(modelsJsonT, content);
        var modelsMessage = Base0 + "/v1/models";
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, modelsMessage));
        var modelsQualified = Base0 + "/v1/models";
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, modelsQualified));
        var modelsTargetTyped = Base0 + "/v1/models";
        HttpRequestMessage m = new(HttpMethod.Post, modelsTargetTyped);
        await http.SendAsync(m);
        var modelsUri = Base0 + "/v1/models";
        http.BaseAddress = new Uri(modelsUri);
    }
}
