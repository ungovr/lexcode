// lexcode-expect: 2
// Chat messages kept in a MongoDB collection: through an injected database, and through one named under an alias.
using MongoDB.Driver;
using Mdb = MongoDB.Driver;

namespace App.Chat;

public class ChatArchive(IMongoDatabase database)
{
    private readonly IMongoCollection<ChatMessage> _messages = database.GetCollection<ChatMessage>("chat_messages");

    public IMongoCollection<ConversationEntry> Entries(Mdb.IMongoDatabase db) => db.GetCollection<ConversationEntry>("entries");
}
