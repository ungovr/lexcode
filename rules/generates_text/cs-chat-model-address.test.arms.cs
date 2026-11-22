// lexcode-expect: 4
// Where a held address is read that the first header did not say (#13205 review A4): each arm of a
// switch expression that picks a provider's address is read as an expression body; a local
// declared in a constructor, logged and never sent, is matched as a declaration (only a local in a
// method, an accessor, an indexer or an operator is left to the send branch); and a base that ends
// in a slash counts, since the address may end in one. A lambda in a field initializer that
// returns an address is not read.
using Microsoft.Extensions.Logging;

namespace Demo.Services.Ai;

public class ProviderAddresses
{
    private const string ResponsesBase = "https://api.openai.com/v1/responses/";

    public static string For(int provider) => provider switch
    {
        1 => "https://api.openai.com/v1/chat/completions",
        2 => "https://api.deepseek.com/chat/completions",
        _ => throw new ArgumentOutOfRangeException(nameof(provider)),
    };

    private readonly Func<string> _endpoint = () => "https://api.mistral.ai/v1/chat/completions";

    public ProviderAddresses(ILogger<ProviderAddresses> logger)
    {
        string configured = "https://api.groq.com/openai/v1/chat/completions";
        logger.LogInformation("Groq endpoint {Url}", configured);
    }
}
