// lexcode-expect: 0
// A lookalike of each Gemini host (the vendor's host followed by another domain, and a name that
// only ends in aiplatform), with the generation path after it. The host must end where the path
// begins, and a regional Vertex AI host is a region, a hyphen and aiplatform.
// Each address is written at the call, held in an interpolated local and sent, and held in a
// const that is posted, posted as JSON (plain and generic), put in a request message (short,
// fully qualified and target-typed) and made a base address; each host also has an
// expression-bodied property joined from a lookalike base.
using System.Net.Http;

namespace Demo.Lookalikes;

public class GeminiLookalikes(HttpClient http)
{
    private const string GeminiLookalike = "https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent";
    private const string GeminiLookalikeBase = "https://generativelanguage.googleapis.com.example.net";
    public static string GeminiJoined => GeminiLookalikeBase + "/v1beta/models/gemini-2.5-flash:generateContent";
    private const string VertexLookalike = "https://us-central1-aiplatform.googleapis.com.example.net/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent";
    private const string VertexLookalikeBase = "https://us-central1-aiplatform.googleapis.com.example.net";
    public static string VertexJoined => VertexLookalikeBase + "/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent";
    private const string FusedVertex = "https://evilaiplatform.googleapis.com/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent";

    public async Task Gemini(HttpContent content, string trace)
    {
        await http.PostAsync("https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent", content);
        await http.PostAsync(GeminiLookalike, content);
        await http.PostAsJsonAsync(GeminiLookalike, content);
        await http.PostAsJsonAsync<object>(GeminiLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, GeminiLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, GeminiLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, GeminiLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(GeminiLookalike);
        var url = $"https://generativelanguage.googleapis.com.example.net/v1beta/models/gemini-2.5-flash:generateContent?trace={trace}";
        await http.PostAsync(url, content);
    }

    public async Task Vertex(HttpContent content, string trace)
    {
        await http.PostAsync("https://us-central1-aiplatform.googleapis.com.example.net/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent", content);
        await http.PostAsync(VertexLookalike, content);
        await http.PostAsJsonAsync(VertexLookalike, content);
        await http.PostAsJsonAsync<object>(VertexLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, VertexLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, VertexLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, VertexLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(VertexLookalike);
        var url = $"https://us-central1-aiplatform.googleapis.com.example.net/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent?trace={trace}";
        await http.PostAsync(url, content);
    }

    public async Task Fused(HttpContent content)
    {
        await http.PostAsync("https://evilaiplatform.googleapis.com/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent", content);
        await http.PostAsync(FusedVertex, content);
    }
}
