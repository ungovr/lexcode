// lexcode-expect: 13
// A Gemini address built by interpolation, concatenation or string.Format, with the model, the
// key, the region or the project in it, and held in a const, a field, a property or a local
// (#13205 B1). Members count where they are declared: a const joined from another const, a
// static field joined with the model, an expression-bodied property formatted with the model and
// the key, an expression-bodied property joined from a base const, and an auto-property for
// Vertex AI with the region and the project interpolated. A local counts where it is sent:
// interpolated and posted (the shape most Gemini helpers use), joined with the model and the key
// into a request message, formatted and posted as JSON, and Vertex AI's address with the region
// and the project handed to a Uri. An address built at the
// call counts there: joined with the model, formatted with the model and the key, and Vertex AI's
// address joined with the region, the project and the model; and the joined const sent.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Services.Ai;

public class GeminiBuilt(HttpClient http)
{
    private const string ModelsBase = "https://generativelanguage.googleapis.com/v1beta/models/";
    private const string FlashUrl = ModelsBase + "gemini-2.5-flash:generateContent";
    public static string ProUrl => ModelsBase + "gemini-2.5-pro:generateContent";
    public static string Model = "gemini-2.5-flash";
    public static string Key = "";
    private static readonly string JoinedUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + Model + ":generateContent";
    public static string FormattedUrl => string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", Model, Key);
    public string VertexUrl { get; } = $"https://{Region}-aiplatform.googleapis.com/v1/projects/{Project}/locations/{Region}/publishers/google/models/{Model}:streamGenerateContent?alt=sse";
    public static string Region = "us-central1";
    public static string Project = "demo";

    public async Task<string> Interpolated(HttpContent content, string model, string key)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";
        var r = await http.PostAsync(url, content);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Joined(HttpContent content, string model, string key)
    {
        string url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;
        var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> Formatted(object body, string model, string key)
    {
        var url = string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", model, key);
        var r = await http.PostAsJsonAsync(url, body);
        return await r.Content.ReadAsStringAsync();
    }

    public void UseVertex(HttpClient client, string region, string project, string model)
    {
        var url = $"https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{model}:generateContent";
        client.BaseAddress = new Uri(url);
    }

    public Task<HttpResponseMessage> AtTheCall(HttpContent content, string model) =>
        http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", content);

    public Task<HttpResponseMessage> FormattedAtTheCall(HttpContent content, string model, string key) =>
        http.PostAsync(string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", model, key), content);

    public Task<HttpResponseMessage> VertexJoined(object body, string region, string project, string model) =>
        http.PostAsJsonAsync("https://" + region + "-aiplatform.googleapis.com/v1/projects/" + project + "/locations/" + region + "/publishers/google/models/" + model + ":generateContent", body);

    public Task<HttpResponseMessage> Flash(HttpContent content) => http.PostAsync(FlashUrl, content);
}
