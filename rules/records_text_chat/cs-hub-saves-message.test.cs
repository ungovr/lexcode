// lexcode-expect: 6
// What a person sends to a SignalR hub, written to a store: a DbSet of messages, a context's Add of a new message, a
// chat service's save, append and record methods (in a strongly typed hub with a primary constructor), and a message
// repository in a hub named under an alias.
using Microsoft.AspNetCore.SignalR;
using Sr = Microsoft.AspNetCore.SignalR;

namespace App.Realtime;

public class ChatHub(ChatDb db) : Hub
{
    public async Task SendMessage(string room, string text)
    {
        await db.Messages.AddAsync(new Message { Room = room, Author = Context.UserIdentifier, Text = text });
        await db.SaveChangesAsync();
        await Clients.Group(room).SendAsync("message", Context.UserIdentifier, text);
    }

    public async Task Edit(string room, string text)
    {
        db.Add(new Message { Room = room, Text = text });
        await db.SaveChangesAsync();
    }
}

public class SupportHub(IChatService chatService) : Hub<ISupportClient>
{
    public async Task Send(string text)
    {
        await chatService.SaveMessageAsync(Context.UserIdentifier!, text);
        await chatService.AppendMessageAsync(Context.UserIdentifier!, text);
        await chatService.RecordMessageAsync(Context.UserIdentifier!, text);
        await Clients.Others.Receive(text);
    }
}

public class AliasHub : Sr.Hub
{
    private readonly IMessageRepository _messageRepository;

    public AliasHub(IMessageRepository messageRepository) => _messageRepository = messageRepository;

    public Task Post(string text) => _messageRepository.InsertAsync(new ChatLine(Context.ConnectionId, text));
}
