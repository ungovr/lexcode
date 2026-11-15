// lexcode-expect: 7
// Bot Framework and Microsoft 365 Agents SDK bots, which answer what people type: an ActivityHandler under the import,
// under an alias and as the generic DialogBot of the samples, a Teams activity handler, a bare IBot, and an
// AgentApplication with and without a primary constructor.
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Builder.Teams;
using Microsoft.Bot.Schema;
using Microsoft.Agents.Builder.App;
using Bf = Microsoft.Bot.Builder;

namespace App.Bots;

public class EchoBot : ActivityHandler
{
    protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
    {
        await turnContext.SendActivityAsync(MessageFactory.Text($"Echo: {turnContext.Activity.Text}"), cancellationToken);
    }
}

public class AliasBot : Bf.ActivityHandler
{
}

public class DialogBot<T> : ActivityHandler where T : Dialog
{
    protected readonly Dialog Dialog;

    public DialogBot(T dialog) => Dialog = dialog;
}

public class TeamsBot : TeamsActivityHandler
{
}

public class RawBot : IBot
{
    public Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

public class HelpAgent(AgentApplicationOptions options) : AgentApplication(options)
{
}

public class OrderAgent : AgentApplication
{
    public OrderAgent(AgentApplicationOptions options) : base(options)
    {
    }
}
