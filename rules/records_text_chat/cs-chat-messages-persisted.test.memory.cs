// lexcode-expect: 11
// The nearest lookalikes of an in-memory store that still write the chat: a repository and a DAO given a chat
// message or a turn with a synchronous Add (the repository pattern's own write), and a store, a collection and a
// container given one with an asynchronous add, an insert or a save, which a plain list does not have; and a
// store held by a data context (`_context.MessageStore`), given a turn with List's synchronous Add, which is the
// context's own store and so a write. A receiver whose first part only begins with store (`_storeDb`, `storeContext`)
// is no store and counts too.
namespace App.Chat;

public class ChatArchive(IChatRepository chatRepository, IMessageRepository messageRepository, MessageDao messageDao, ChatStore store, MessageCollection collection, IStateContainer container, AppDbContext _context, ChatDb db, StoreDb _storeDb, StoreContext storeContext)
{
    public async Task KeepAsync(string text, string reply)
    {
        chatRepository.Add(new ChatMessage { Text = text });
        messageRepository.Add(new Message { Role = "assistant", Content = reply });
        messageDao.AddRange(new[] { new ChatMessage { Text = text } });
        await store.AddAsync(new ChatMessage { Text = text });
        await collection.InsertOneAsync(new ChatMessage { Role = "user", Text = text });
        await container.SaveAsync(new ChatMessage { Text = reply });
        await store.SaveAsync(new Message { Role = "user", Content = text });
        _context.MessageStore.Add(new ChatMessage { Role = "user", Text = text });
        db.ChatStore.Add(new Message { Role = "assistant", Content = reply });
        _storeDb.Messages.Add(new ChatMessage { Role = "user", Text = text });
        storeContext.Messages.Add(new Message { Role = "assistant", Content = reply });
    }
}
