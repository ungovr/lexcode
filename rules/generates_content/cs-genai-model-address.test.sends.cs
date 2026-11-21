// lexcode-expect: 6
// A hosted Gemini model's address written at the call that sends to it, or carried there from a
// const or a local in the same file: an interpolated model and key with PostAsync, a POST request
// message for streamGenerateContent, Vertex AI's regional host interpolated with
// PostAsJsonAsync, a Uri given to the client as its base address, the const sent with PostAsync
// (the const counts too).
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Services.Ai;

public class GeminiCalls(HttpClient http)
{
    private const string FlashUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

    public Task<HttpResponseMessage> Generate(HttpContent content, string model, string key) =>
        http.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}", content);

    public Task<HttpResponseMessage> Stream(HttpContent content)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse") { Content = content };
        return http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
    }

    public Task<HttpResponseMessage> Vertex(object body, string region, string project, string model) =>
        http.PostAsJsonAsync($"https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{model}:generateContent", body);

    public void UseGemini(HttpClient client)
    {
        client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent");
    }

    public Task<HttpResponseMessage> Flash(HttpContent content) => http.PostAsync(FlashUrl, content);
}
