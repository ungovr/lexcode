// lexcode-expect: 25
// Generation addresses the engine carries to the call (#13205 review A3), each joined from a base
// const (a value only the carried-value branch reads, since no literal holds it whole): OpenAI's
// chat completions with a query and Anthropic's Messages API held in consts, and DeepSeek's chat
// endpoint with a query held in a local, each sent in every shape the carried-value branch reads
// (posted, posted as JSON plain and generic, a short, qualified and target-typed request message,
// and a base address). Each const also counts where it is declared.
// Each const has an expression-bodied property twin joined the same way.
using System.Net.Http;
using System.Net.Http.Json;

namespace Demo.Carried;

public class TextCarried(HttpClient http)
{
    private const string Base0 = "https://api.openai.com";
    private const string Base1 = "https://api.anthropic.com";
    private const string Base2 = "https://api.deepseek.com";
    private const string ChatQuery = Base0 + "/v1/chat/completions?api-version=2024-10-01";
    private const string Claude = Base1 + "/v1/messages";
    public static string ChatQueryProperty => Base0 + "/v1/chat/completions?api-version=2024-10-01";
    public static string ClaudeProperty => Base1 + "/v1/messages";

    public async Task ChatQuerySends(HttpContent content)
    {
        await http.PostAsync(ChatQuery, content);
        await http.PostAsJsonAsync(ChatQuery, content);
        await http.PostAsJsonAsync<object>(ChatQuery, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, ChatQuery));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, ChatQuery));
        HttpRequestMessage m = new(HttpMethod.Post, ChatQuery);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(ChatQuery);
    }

    public async Task ClaudeSends(HttpContent content)
    {
        await http.PostAsync(Claude, content);
        await http.PostAsJsonAsync(Claude, content);
        await http.PostAsJsonAsync<object>(Claude, content);
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, Claude));
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, Claude));
        HttpRequestMessage m = new(HttpMethod.Post, Claude);
        await http.SendAsync(m);
        http.BaseAddress = new Uri(Claude);
    }

    public async Task DeepSeekQuerySends(HttpContent content)
    {
        var deepseekqueryPost = Base2 + "/chat/completions?trace=1";
        await http.PostAsync(deepseekqueryPost, content);
        var deepseekqueryJson = Base2 + "/chat/completions?trace=1";
        await http.PostAsJsonAsync(deepseekqueryJson, content);
        var deepseekqueryJsonT = Base2 + "/chat/completions?trace=1";
        await http.PostAsJsonAsync<object>(deepseekqueryJsonT, content);
        var deepseekqueryMessage = Base2 + "/chat/completions?trace=1";
        await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, deepseekqueryMessage));
        var deepseekqueryQualified = Base2 + "/chat/completions?trace=1";
        await http.SendAsync(new System.Net.Http.HttpRequestMessage(HttpMethod.Post, deepseekqueryQualified));
        var deepseekqueryTargetTyped = Base2 + "/chat/completions?trace=1";
        HttpRequestMessage m = new(HttpMethod.Post, deepseekqueryTargetTyped);
        await http.SendAsync(m);
        var deepseekqueryUri = Base2 + "/chat/completions?trace=1";
        http.BaseAddress = new Uri(deepseekqueryUri);
    }
}
