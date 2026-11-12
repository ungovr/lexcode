// lexcode-expect: 0
// Turns kept only in memory for the length of a session (a Microsoft.Extensions.AI message list, a list named for the
// chat history, a view model's ChatMessages, a state object's ChatHistory, a session object, a context object for the
// prompt, a prompt list with a user role, a chat context object's Messages and ChatMessages with a user role), a
// contact form and a support ticket saved, a chat room created with no text in it, a chat room repository, account
// records with a user or admin role, and a Dapper insert into a contact table.
using Dapper;
using Microsoft.Extensions.AI;

namespace App.Support;

public class SupportService(AppDb db, ChatRoomRepository chatRoomRepository, System.Data.IDbConnection connection)
{
    public IList<ChatMessage> Messages { get; } = [];
    private readonly List<ChatMessage> _chatHistory = [];

    public void Remember(string userText)
    {
        Messages.Add(new ChatMessage(ChatRole.User, userText));
        _chatHistory.Add(new ChatMessage(ChatRole.User, userText));
        _chatHistory.AddRange(Messages);
    }

    public async Task HoldersAsync(IChatClient client, ChatState state, ChatSession session, string text)
    {
        this.ChatMessages.Add(new ChatMessage(ChatRole.User, text));
        state.ChatHistory.Add(new ChatMessage(ChatRole.User, text));
        var r = await client.GetResponseAsync(state.ChatHistory);
        state.ChatHistory.AddRange(r.Messages);
        session.Add(new ChatMessage(ChatRole.User, text));
        var conversationContext = new ChatSession();
        conversationContext.Add(new ChatMessage(ChatRole.System, "You are terse."));
        var prompt = new List<PromptMessage>();
        prompt.Add(new PromptMessage { Role = "user", Content = text });
        db.Add(new UserRoleEntry { Role = "admin", UserId = text });
    }

    public void RoleHolders(ChatContext chatContext, string text)
    {
        chatContext.Messages.Add(new ChatMessage { Role = ChatRole.User, Text = text });
        chatContext.Messages.Add(new PromptTurn { Role = "user", Content = text });
        chatContext.ChatMessages.Add(new ChatMessage(ChatRole.User, text));
        db.Add(new UserRoleEntry { Role = "user", UserId = text });
        db.Members.Add(new MemberEntry { Role = UserRole.User, Name = text });
    }

    public System.Collections.ObjectModel.ObservableCollection<ChatMessage> ChatMessages { get; } = [];

    public async Task ContactAsync(ContactForm form)
    {
        db.ContactMessages.Add(new ContactMessage { Email = form.Email, Body = form.Body });
        db.Tickets.Add(new Ticket { Subject = form.Subject });
        await db.ChatRooms.AddAsync(new ChatRoom { Name = form.Subject });
        await chatRoomRepository.AddAsync(new ChatRoom { Name = form.Subject });
        await connection.ExecuteAsync("INSERT INTO contact_requests (email, body) VALUES (@Email, @Body)", form);
        await db.SaveChangesAsync();
    }
}
