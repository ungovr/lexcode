// lexcode-expect: 0
// A Bot Framework transcript logger over the in-memory store, which keeps the turns only until the process ends, and
// the app's own TranscriptLoggerMiddleware (an HTTP request logger in the app's namespace), which is not the Bot
// Framework's.
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using App.Diagnostics;

namespace App.Bots;

public class AdapterWithLogging : CloudAdapter
{
    public AdapterWithLogging(BotFrameworkAuthentication auth) : base(auth)
    {
        Use(new Microsoft.Bot.Builder.TranscriptLoggerMiddleware(new Microsoft.Bot.Builder.MemoryTranscriptStore()));
    }
}

public static class Pipeline
{
    public static void Configure(IApplicationBuilder app, RequestLogStore store) =>
        app.UseMiddleware<RequestLogger>(new TranscriptLoggerMiddleware(store));
}
