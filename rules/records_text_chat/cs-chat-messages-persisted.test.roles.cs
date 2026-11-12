// lexcode-expect: 4
// Chat turns written to a store: EF Core's asynchronous add on a chat-named set of a data facade, and records of any
// message type saved with a literal user or assistant role (a string and an enum, on a DbSet, through a context's Add,
// and through a repository).
namespace App.Assistant;

public class TurnWriter(AppData data, AppDbContext db, IMessageRepository messageRepository)
{
    public async Task SaveAsync(ChatMessage message)
    {
        await data.ChatMessages.AddAsync(message);
    }

    public async Task StoreReplyAsync(string sessionId, string reply)
    {
        db.Messages.Add(new Message { SessionId = sessionId, Role = "assistant", Content = reply });
        db.Add(new Message(sessionId) { Role = MessageRole.User, Content = reply });
        await messageRepository.AddAsync(new TranscriptEntry { Role = "user", Text = reply });
        await db.SaveChangesAsync();
    }
}
