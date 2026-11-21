// lexcode-expect: 0
// A lookalike of each hosted text model's host (the vendor's host followed by another domain),
// with the generation path after it. The host must end where the path begins.
// Each address is written at the call, held in an interpolated local and sent, and held in a
// const that is posted, posted as JSON (plain and generic), put in a request message (short,
// fully qualified and target-typed) and made a base address; each host also has an
// expression-bodied property joined from a lookalike base.
using System.Net.Http;

namespace Demo.Lookalikes;

public class TextLookalikes(HttpClient http)
{
    private const string OpenAiLookalike = "https://api.openai.com.example.net/v1/chat/completions";
    private const string OpenAiLookalikeBase = "https://api.openai.com.example.net";
    public static string OpenAiJoined => OpenAiLookalikeBase + "/v1/chat/completions";
    private const string AnthropicLookalike = "https://api.anthropic.com.example.net/v1/messages";
    private const string AnthropicLookalikeBase = "https://api.anthropic.com.example.net";
    public static string AnthropicJoined => AnthropicLookalikeBase + "/v1/messages";
    private const string MistralLookalike = "https://api.mistral.ai.example.net/v1/chat/completions";
    private const string MistralLookalikeBase = "https://api.mistral.ai.example.net";
    public static string MistralJoined => MistralLookalikeBase + "/v1/chat/completions";
    private const string GroqLookalike = "https://api.groq.com.example.net/openai/v1/chat/completions";
    private const string GroqLookalikeBase = "https://api.groq.com.example.net";
    public static string GroqJoined => GroqLookalikeBase + "/openai/v1/chat/completions";
    private const string DeepSeekLookalike = "https://api.deepseek.com.example.net/chat/completions";
    private const string DeepSeekLookalikeBase = "https://api.deepseek.com.example.net";
    public static string DeepSeekJoined => DeepSeekLookalikeBase + "/chat/completions";

    public async Task OpenAi(HttpContent content, string trace)
    {
        await http.PostAsync("https://api.openai.com.example.net/v1/chat/completions", content);
        await http.PostAsync(OpenAiLookalike, content);
        await http.PostAsJsonAsync(OpenAiLookalike, content);
        await http.PostAsJsonAsync<object>(OpenAiLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, OpenAiLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, OpenAiLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, OpenAiLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(OpenAiLookalike);
        var url = $"https://api.openai.com.example.net/v1/chat/completions?trace={trace}";
        await http.PostAsync(url, content);
    }

    public async Task Anthropic(HttpContent content, string trace)
    {
        await http.PostAsync("https://api.anthropic.com.example.net/v1/messages", content);
        await http.PostAsync(AnthropicLookalike, content);
        await http.PostAsJsonAsync(AnthropicLookalike, content);
        await http.PostAsJsonAsync<object>(AnthropicLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, AnthropicLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, AnthropicLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, AnthropicLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(AnthropicLookalike);
        var url = $"https://api.anthropic.com.example.net/v1/messages?trace={trace}";
        await http.PostAsync(url, content);
    }

    public async Task Mistral(HttpContent content, string trace)
    {
        await http.PostAsync("https://api.mistral.ai.example.net/v1/chat/completions", content);
        await http.PostAsync(MistralLookalike, content);
        await http.PostAsJsonAsync(MistralLookalike, content);
        await http.PostAsJsonAsync<object>(MistralLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, MistralLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, MistralLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, MistralLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(MistralLookalike);
        var url = $"https://api.mistral.ai.example.net/v1/chat/completions?trace={trace}";
        await http.PostAsync(url, content);
    }

    public async Task Groq(HttpContent content, string trace)
    {
        await http.PostAsync("https://api.groq.com.example.net/openai/v1/chat/completions", content);
        await http.PostAsync(GroqLookalike, content);
        await http.PostAsJsonAsync(GroqLookalike, content);
        await http.PostAsJsonAsync<object>(GroqLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, GroqLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, GroqLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, GroqLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(GroqLookalike);
        var url = $"https://api.groq.com.example.net/openai/v1/chat/completions?trace={trace}";
        await http.PostAsync(url, content);
    }

    public async Task DeepSeek(HttpContent content, string trace)
    {
        await http.PostAsync("https://api.deepseek.com.example.net/chat/completions", content);
        await http.PostAsync(DeepSeekLookalike, content);
        await http.PostAsJsonAsync(DeepSeekLookalike, content);
        await http.PostAsJsonAsync<object>(DeepSeekLookalike, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, DeepSeekLookalike) { Content = content });
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, DeepSeekLookalike));
        HttpRequestMessage message = new(HttpMethod.Post, DeepSeekLookalike);
        await http.SendAsync(message);
        http.BaseAddress = new Uri(DeepSeekLookalike);
        var url = $"https://api.deepseek.com.example.net/chat/completions?trace={trace}";
        await http.PostAsync(url, content);
    }
}
