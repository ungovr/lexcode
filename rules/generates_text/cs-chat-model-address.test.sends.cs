// lexcode-expect: 9
// A hosted text model's address written at the call that sends to it: PostAsync, the generic
// PostAsJsonAsync and a named requestUri, a POST request message built positionally, with a
// target-typed new() and with named arguments, a Uri given to the client as its base address,
// an interpolated address with a query, and an address with a trailing slash.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Services.Ai;

public class ModelCalls(HttpClient http)
{
    public Task<HttpResponseMessage> Chat(HttpContent content) =>
        http.PostAsync("https://api.openai.com/v1/chat/completions", content);

    public Task<HttpResponseMessage> Claude(object body) =>
        http.PostAsJsonAsync<object>("https://api.anthropic.com/v1/messages", body);

    public Task<HttpResponseMessage> Mistral(HttpContent content) =>
        http.PostAsync(content: content, requestUri: "https://api.mistral.ai/v1/chat/completions");

    public Task<HttpResponseMessage> Responses(HttpContent content)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses") { Content = content };
        return http.SendAsync(request);
    }

    public Task<HttpResponseMessage> DeepSeek(HttpContent content)
    {
        HttpRequestMessage request = new(HttpMethod.Post, "https://api.deepseek.com/chat/completions") { Content = content };
        return http.SendAsync(request);
    }

    public Task<HttpResponseMessage> Groq(HttpContent content)
    {
        var request = new HttpRequestMessage(requestUri: "https://api.groq.com/openai/v1/chat/completions", method: HttpMethod.Post);
        request.Content = content;
        return http.SendAsync(request);
    }

    public void UseAnthropic(HttpClient client)
    {
        client.BaseAddress = new Uri("https://api.anthropic.com/v1/messages");
    }

    public Task<HttpResponseMessage> Stored(HttpContent content, string flag) =>
        http.PostAsync($"https://api.openai.com/v1/chat/completions?store={flag}", content);

    public Task<HttpResponseMessage> Slash(HttpContent content) =>
        http.PostAsync("https://api.openai.com/v1/responses/", content);
}
