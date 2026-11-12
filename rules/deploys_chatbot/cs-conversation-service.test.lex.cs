// lexcode-expect: 4
// What a person typed sent to an Amazon Lex V2 bot: through the injected interface, the client constructed under the
// import, target-typed, and named under an alias.
using Amazon;
using Amazon.LexRuntimeV2;
using Amazon.LexRuntimeV2.Model;
using Lex = Amazon.LexRuntimeV2;

namespace App.Support;

public class LexChat(IAmazonLexRuntimeV2 lex)
{
    public async Task<string> AskAsync(string sessionId, string text)
    {
        var response = await lex.RecognizeTextAsync(new RecognizeTextRequest { BotId = "B", BotAliasId = "A", LocaleId = "en_US", SessionId = sessionId, Text = text });
        return response.Messages[0].Content;
    }

    public async Task ConstructedAsync(string text)
    {
        var client = new AmazonLexRuntimeV2Client(RegionEndpoint.USEast1);
        await client.RecognizeTextAsync(new RecognizeTextRequest { Text = text });
    }

    public async Task TargetTypedAsync(string text)
    {
        AmazonLexRuntimeV2Client client = new();
        await client.RecognizeTextAsync(new RecognizeTextRequest { Text = text });
    }

    public async Task AliasAsync(Lex.IAmazonLexRuntimeV2 runtime, Stream audio)
    {
        await runtime.RecognizeUtteranceAsync(new RecognizeUtteranceRequest { InputStream = audio });
    }
}
