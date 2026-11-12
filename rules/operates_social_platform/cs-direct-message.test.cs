// lexcode-expect: 9
// A message from one user account to another: a private or direct message entity with a sender
// and a recipient (properties, fields or a record), and a SignalR hub or hub context that sends a
// chat message to one user, one connection or one conversation group. The hub is reached through
// a using, through an alias and fully qualified, and the hub context is injected as a field and as
// a primary-constructor parameter, written short and fully qualified.
using System;
using Microsoft.AspNetCore.SignalR;
using Sig = Microsoft.AspNetCore.SignalR;

namespace Demo.Social;

public partial class PrivateMessage
{
    public int FromCustomerId { get; set; }
    public int ToCustomerId { get; set; }
    public string Text { get; set; }
    public bool IsRead { get; set; }
}

public class DirectMessage
{
    private Guid _senderId;
    private Guid _recipientId;
}

public record UserChatMessage(Guid SenderId, Guid ReceiverId, string Body);

public class ChatHub : Sig.Hub
{
    public Task SendDirect(string toUserId, string text) =>
        Clients.User(toUserId).SendAsync("ReceiveDirectMessage", Context.UserIdentifier, text);
}

public class ConversationHub : Hub<IConversationClient>
{
    public async Task Post(string conversationId, string text)
    {
        await Clients.Group(conversationId).NewChatMessage(Context.UserIdentifier, text);
    }
}

public class InboxRelay(IHubContext<ChatHub> hub)
{
    private readonly IHubContext<ChatHub> _hub = hub;

    public Task Deliver(string toUserId, string text) => _hub.Clients.User(toUserId).SendAsync("dm", text);

    public Task Echo(string connectionId, string text) => hub.Clients.Client(connectionId).SendAsync("privateMessage", text);
}

public class RoomHub : Microsoft.AspNetCore.SignalR.Hub<IConversationClient>
{
    public Task Say(string roomId, string text) => Clients.Group(roomId).NewChatMessage(Context.UserIdentifier, text);
}

public class Mailbox(Microsoft.AspNetCore.SignalR.IHubContext<ChatHub> hub)
{
    public Task Deliver(string toUserId, string text) => hub.Clients.User(toUserId).SendAsync("ReceiveMessage", text);
}

public interface IConversationClient
{
    Task NewChatMessage(string fromUserId, string text);
}
