// lexcode-expect: 0
// Turns kept only in memory for the length of a session (a Microsoft.Extensions.AI message list and a list named for
// the chat history), a contact form and a support ticket saved, a chat room created with no text in it, a chat room
// repository, and a Dapper insert into a contact table.
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
