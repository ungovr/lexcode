// lexcode-expect: 7
// Microsoft.Extensions.AI: the model's reply is added back to the running history that the next user turn is sent
// with, by AddMessages on a response (the eShop shape) and on streamed updates, and by a ChatMessage in the assistant
// role built from the reply: under the import, under an alias, target-typed, and with an initializer.
using Microsoft.Extensions.AI;
using Ai = Microsoft.Extensions.AI;

namespace App.Concierge;

public class ChatState(IChatClient chatClient)
{
    public IList<ChatMessage> Messages { get; } = [];

    public async Task AddUserMessageAsync(string userText)
    {
        Messages.Add(new ChatMessage(ChatRole.User, userText));
        var response = await chatClient.GetResponseAsync(Messages);
        Messages.AddMessages(response);
    }

    public async Task StreamAsync(List<ChatMessage> history, string userText)
    {
        history.Add(new(ChatRole.User, userText));
        List<ChatResponseUpdate> updates = [];
        await foreach (var update in chatClient.GetStreamingResponseAsync(history))
        {
            updates.Add(update);
        }
        history.AddMessages(updates);
    }

    public async Task ExplicitAsync(List<ChatMessage> history, string userText)
    {
        history.Add(new ChatMessage(ChatRole.User, userText));
        var reply = await chatClient.GetResponseAsync(history);
        history.Add(new ChatMessage(ChatRole.Assistant, reply.Text));
    }

    public async Task AliasAsync(List<Ai.ChatMessage> history, string userText)
    {
        history.Add(new Ai.ChatMessage(Ai.ChatRole.User, userText));
        var reply = await chatClient.GetResponseAsync(history);
        history.Add(new Ai.ChatMessage(Ai.ChatRole.Assistant, reply.Text));
    }

    public async Task TargetTypedAsync(List<ChatMessage> history, string userText)
    {
        history.Add(new(ChatRole.User, userText));
        var reply = await chatClient.GetResponseAsync(history);
        history.Add(new(ChatRole.Assistant, reply.Text));
    }

    public async Task InitializerAsync(List<ChatMessage> history, string userText)
    {
        history.Add(new ChatMessage(ChatRole.User, userText));
        var reply = await chatClient.GetResponseAsync(history);
        history.Add(new ChatMessage(ChatRole.Assistant, reply.Text) { AuthorName = "concierge" });
        history.Add(new(ChatRole.Assistant, reply.Text) { AuthorName = "concierge" });
    }
}
