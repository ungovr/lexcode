// lexcode-expect: 2
// Bots whose primary constructor calls the base constructor explicitly: an ActivityHandler and a Teams activity
// handler.
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Teams;

namespace App.Bots;

public class GreetingBot(ILogger<GreetingBot> logger) : ActivityHandler()
{
}

public class StandupBot(IStandupStore standups) : TeamsActivityHandler()
{
}
