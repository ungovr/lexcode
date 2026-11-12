// lexcode-expect: 6
// Stores whose names begin with chat or conversation are still stores when the name ends in Db or DbContext: a
// ChatDbContext's set added to synchronously and asynchronously, an EF context named ChatContext added to
// asynchronously, a chat database given an assistant turn and a conversation database given a user turn, and a
// ChatDbContext given a new chat message.
using Microsoft.EntityFrameworkCore;

namespace App.Chat;

public class Writers(ChatDbContext chatDbContext, ChatContext chatContext, ChatDb chatDb, ConversationDb conversationDb)
{
    public async Task SaveAsync(ChatMessage m, string text)
    {
        chatDbContext.ChatMessages.Add(m);
        await chatDbContext.ChatMessages.AddAsync(m);
        await chatContext.ChatMessages.AddAsync(m);
        chatDb.Messages.Add(new Message { Role = "assistant", Content = text });
        conversationDb.Add(new Message { Role = "user", Content = text });
        chatDbContext.Add(new ChatMessage { RoomId = 1, Body = text });
        await chatDbContext.SaveChangesAsync();
    }
}
