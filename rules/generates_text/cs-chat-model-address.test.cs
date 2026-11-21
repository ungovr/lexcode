// lexcode-expect: 4
// A hosted text model's address held in a static property, the way an app keeps its AI settings
// in a defaults class and sends from a helper in another file (nopCommerce's
// ArtificialIntelligenceDefaults): OpenAI's Responses API and DeepSeek's chat endpoint as
// expression-bodied properties, Mistral's as an auto-property with an initializer, and
// Anthropic's Messages API returned from a getter. The model name and the header name are not
// addresses.
namespace Demo.Services.Ai;

public partial class AiDefaults
{
    public static string ChatGptApiModel => "gpt-4.1";

    public static string ChatGptBaseApiUrl => "https://api.openai.com/v1/responses";

    public static string DeepSeekBaseApiUrl => "https://api.deepseek.com/chat/completions";

    public static string MistralApiUrl { get; } = "https://api.mistral.ai/v1/chat/completions";

    public static string ClaudeApiUrl
    {
        get { return "https://api.anthropic.com/v1/messages"; }
    }

    public static string ApiKeyHeader => "x-api-key";
}

public class ChatGptHelper
{
    // The address reaches the client through another class's property, which the engine does not
    // follow; the property above is the match.
    public void ConfigureClient(HttpClient httpClient)
    {
        httpClient.BaseAddress = new Uri(AiDefaults.ChatGptBaseApiUrl);
    }

    public HttpRequestMessage CreateRequest(string query)
    {
        var request = new HttpRequestMessage { Method = HttpMethod.Post };
        request.Content = new StringContent(query);
        return request;
    }
}
