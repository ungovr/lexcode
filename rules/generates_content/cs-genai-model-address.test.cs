// lexcode-expect: 4
// A hosted Gemini model's address held in a static property or a const, the way an app keeps its
// AI settings in a defaults class and sends from a helper in another file (nopCommerce's
// ArtificialIntelligenceDefaults): the Gemini API's generateContent as an expression-bodied
// property, Vertex AI's streamGenerateContent as a const, an interpolated model name in an
// auto-property's initializer, and the Pro model's address returned from a getter. The header
// name and the model list are not generation addresses.
namespace Demo.Services.Ai;

public partial class AiDefaults
{
    public static string GeminiBaseApiUrl => "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public static string GeminiApiKeyHeader => "x-goog-api-key";

    public const string VertexStreamUrl = "https://us-central1-aiplatform.googleapis.com/v1/projects/demo/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent?alt=sse";

    public static string Model { get; set; } = "gemini-2.5-flash";

    public static string GeminiProUrl
    {
        get { return "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"; }
    }

    public string GeminiModelUrl { get; } = $"https://generativelanguage.googleapis.com/v1beta/models/{Model}:generateContent";
}

public class GeminiHelper
{
    // The address reaches the client through another class's property, which the engine does not
    // follow; the property above is the match.
    public void ConfigureClient(HttpClient httpClient)
    {
        httpClient.BaseAddress = new Uri(AiDefaults.GeminiBaseApiUrl);
    }
}
