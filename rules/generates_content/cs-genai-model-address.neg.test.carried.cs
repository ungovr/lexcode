// lexcode-expect: 0
// Addresses next to the Gemini generation ones, carried to the call (#13205 review A3), each joined
// from a base const, so that no literal holds it whole and only the carried-value branch reads it:
// a method name that only begins with generateContent, countTokens, embedContent and a host that
// only ends in aiplatform held in consts, and the model list held in a local, each sent in every
// shape the carried-value branch reads.
// Each const has an expression-bodied property twin joined the same way.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Carried;

public class GeminiCarriedReads(HttpClient http)
{
    private const string Base0 = "https://generativelanguage.googleapis.com";
    private const string Base1 = "https://evilaiplatform.googleapis.com";
    private const string Cached = Base0 + "/v1beta/models/gemini-2.5-flash:generateContentCached";
    private const string Count = Base0 + "/v1beta/models/gemini-2.5-flash:countTokens";
    private const string Embed = Base0 + "/v1beta/models/gemini-embedding-001:embedContent";
    private const string FusedVertex = Base1 + "/v1/projects/p/locations/l/publishers/google/models/m:generateContent";
    public static string CachedProperty => Base0 + "/v1beta/models/gemini-2.5-flash:generateContentCached";
    public static string CountProperty => Base0 + "/v1beta/models/gemini-2.5-flash:countTokens";
    public static string EmbedProperty => Base0 + "/v1beta/models/gemini-embedding-001:embedContent";
    public static string FusedVertexProperty => Base1 + "/v1/projects/p/locations/l/publishers/google/models/m:generateContent";

    public async Task CachedSends(HttpContent content)
    {
        await http.PostAsync(Cached, content);
        await http.PostAsJsonAsync(Cached, content);
        await http.PostAsJsonAsync<object>(Cached, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Cached));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Cached));
        HttpRequestMessage m = new(HttpMethod.Post, Cached);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Cached);
    }

    public async Task CountSends(HttpContent content)
    {
        await http.PostAsync(Count, content);
        await http.PostAsJsonAsync(Count, content);
        await http.PostAsJsonAsync<object>(Count, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Count));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Count));
        HttpRequestMessage m = new(HttpMethod.Post, Count);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Count);
    }

    public async Task EmbedSends(HttpContent content)
    {
        await http.PostAsync(Embed, content);
        await http.PostAsJsonAsync(Embed, content);
        await http.PostAsJsonAsync<object>(Embed, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Embed));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Embed));
        HttpRequestMessage m = new(HttpMethod.Post, Embed);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Embed);
    }

    public async Task FusedVertexSends(HttpContent content)
    {
        await http.PostAsync(FusedVertex, content);
        await http.PostAsJsonAsync(FusedVertex, content);
        await http.PostAsJsonAsync<object>(FusedVertex, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, FusedVertex));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, FusedVertex));
        HttpRequestMessage m = new(HttpMethod.Post, FusedVertex);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(FusedVertex);
    }

    public async Task ModelListSends(HttpContent content)
    {
        var modellistPost = Base0 + "/v1beta/models";
        await http.PostAsync(modellistPost, content);
        var modellistJson = Base0 + "/v1beta/models";
        await http.PostAsJsonAsync(modellistJson, content);
        var modellistJsonT = Base0 + "/v1beta/models";
        await http.PostAsJsonAsync<object>(modellistJsonT, content);
        var modellistMessage = Base0 + "/v1beta/models";
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, modellistMessage));
        var modellistQualified = Base0 + "/v1beta/models";
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, modellistQualified));
        var modellistTargetTyped = Base0 + "/v1beta/models";
        HttpRequestMessage m = new(HttpMethod.Post, modellistTargetTyped);
        await http.SendAsync(m);
        var modellistUri = Base0 + "/v1beta/models";
        http.BaseAddress = new Uri(modellistUri);
    }
}
