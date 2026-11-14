// lexcode-expect: 0
// A one-shot tool: the request's single question pasted into a fixed prompt. A history the app loads from its own
// store, not from the request. The request's messages handed to a mailer, and to the app's own IChatClient (a
// help-desk ticket client in the app's namespace), which is not Microsoft.Extensions.AI's.
using App.HelpDesk;

namespace App.Api;

public static class Endpoints
{
    public static void Map(WebApplication app, Microsoft.Extensions.AI.IChatClient model, TranscriptStore store, IMailer mailer)
    {
        app.MapPost("/ask", async (AskRequest request) =>
            (await model.GetResponseAsync($"Answer in one sentence: {request.Question}")).Text);

        app.MapPost("/resume/{id}", async (string id) =>
            (await model.GetResponseAsync(store.Load(id))).Text);

        app.MapPost("/forward", async (ForwardRequest request) => await mailer.SendAsync(request.Messages));

        app.MapPost("/ticket", async (TicketRequest request, IChatClient tickets) =>
            await tickets.GetResponseAsync(request.Messages));
    }
}
