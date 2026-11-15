// lexcode-expect: 4
// Bot Framework conversations logged to a transcript store that outlives the process: the logger middleware over an
// injected store, over a blob store built inline (reported once, on the middleware), under an alias, and a blob
// transcript store registered on its own, target-typed.
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Azure.Blobs;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Bb = Microsoft.Bot.Builder;

namespace App.Bots;

public class AdapterWithTranscripts : CloudAdapter
{
    public AdapterWithTranscripts(BotFrameworkAuthentication auth, ITranscriptStore store) : base(auth)
    {
        Use(new TranscriptLoggerMiddleware(store));
    }

    public void Blob(string connection) => Use(new TranscriptLoggerMiddleware(new BlobsTranscriptStore(connection, "transcripts")));

    public void Alias(ITranscriptStore store) => Use(new Bb.TranscriptLoggerMiddleware(store));
}

public static class Registration
{
    public static void AddTranscripts(IServiceCollection services, string connection)
    {
        BlobsTranscriptStore store = new(connection, "transcripts");
        services.AddSingleton<ITranscriptStore>(store);
    }
}
