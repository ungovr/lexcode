// lexcode-expect: 7
// The text of a chat written to a store: a DbSet named for chat messages (Add and AddRange), a context's Add of a
// conversation turn, a chat repository, a MongoDB collection named for chat messages, a Cosmos DB container given a
// chat transcript, and a Dapper insert into a chat table.
using Dapper;
using Microsoft.Azure.Cosmos;

namespace App.Chat;

public class ChatWriter(ChatDbContext db, IChatMessageRepository chatMessageRepository, Container container, System.Data.IDbConnection connection)
{
    private readonly MongoDB.Driver.IMongoCollection<ChatMessage> _chatMessages = null!;

    public async Task SaveAsync(string roomId, string author, string text)
    {
        db.ChatMessages.Add(new ChatMessage { RoomId = roomId, Author = author, Body = text });
        await db.SaveChangesAsync();
    }

    public async Task SaveTurnsAsync(IEnumerable<ChatMessage> turns, string question)
    {
        db.ChatMessages.AddRange(turns);
        await db.AddAsync(new ConversationTurn(question));
        await db.SaveChangesAsync();
    }

    public Task RepositoryAsync(ChatMessage message) => chatMessageRepository.AddAsync(message);

    public Task MongoAsync(ChatMessage message) => _chatMessages.InsertOneAsync(message);

    public Task CosmosAsync(string sessionId, string text) =>
        container.CreateItemAsync(new ChatTranscript { SessionId = sessionId, Text = text });

    public Task DapperAsync(ChatMessage message) =>
        connection.ExecuteAsync("INSERT INTO chat_messages (room_id, author, body) VALUES (@RoomId, @Author, @Body)", message);
}
