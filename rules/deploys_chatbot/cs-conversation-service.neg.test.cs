// lexcode-expect: 0
// The app's own ActivityHandler (an audit-log handler) and SessionsClient (a client for the app's login sessions) in
// its own namespace, RecognizeTextAsync on an OCR engine, DetectIntentAsync on the app's own intent registry, and the
// Amazon Lex model-building client, which defines bots and answers no one.
using Amazon.LexModelsV2;
using App.Audit;
using App.Sessions;

namespace App.Ops;

public class AuditTrail : ActivityHandler
{
    public override Task OnActivityAsync(AuditEvent e) => Task.CompletedTask;
}

public class Scanner(IOcrEngine ocr, IntentRegistry intents, IAmazonLexModelsV2 lexModels)
{
    public async Task<string> ReadAsync(byte[] image) => await ocr.RecognizeTextAsync(image);

    public async Task<string> RouteAsync(string path) => (await intents.DetectIntentAsync(path)).Name;

    public async Task BuildAsync() => await lexModels.BuildBotLocaleAsync(new() { BotId = "b", BotVersion = "DRAFT", LocaleId = "en_US" });

    public async Task<int> ActiveAsync()
    {
        var sessions = SessionsClient.Create();
        return await sessions.CountAsync();
    }
}
