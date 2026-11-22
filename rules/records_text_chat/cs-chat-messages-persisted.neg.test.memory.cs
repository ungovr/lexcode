// lexcode-expect: 0
// Chats kept in memory only, as a Blazor app keeps them: its own store class, a list-backed collection, a state
// container and a table of rows on screen, each given a chat message or a turn with List's synchronous Add or
// AddRange. A store, collection, container or table is as often a plain list as a database, so its synchronous add
// is not taken for a write (#13233). A store's list is reached through a field, `this.` and the type's own name.
using System.Collections.ObjectModel;

namespace App.Chat;

public class ChatMessage
{
    public string Text { get; set; } = "";
    public string Role { get; set; } = "";
}

public class ChatStore
{
    private readonly List<ChatMessage> _items = [];
    public void Add(ChatMessage m) => _items.Add(m);
    public void AddRange(IEnumerable<ChatMessage> ms) => _items.AddRange(ms);
    public static List<ChatMessage> Messages { get; } = [];
}

public class ChatPanel(ChatStore chatStore, ChatStore store)
{
    private readonly ChatStore _store = chatStore;
    private readonly ObservableCollection<ChatMessage> _messageCollection = [];
    private readonly ObservableCollection<ChatMessage> chatMessageCollection = [];

    public void Post(string text, string reply)
    {
        // The entity branch: a chat message on a store.
        _store.Add(new ChatMessage { Text = text });
        this._store.Add(new ChatMessage { Text = text });
        // The role branch: a turn with a literal role on a store, and on a store's list.
        store.Add(new ChatMessage { Role = "assistant", Text = reply });
        _store.Messages.Add(new ChatMessage { Role = "user", Text = text });
        this._store.Messages.Add(new ChatMessage { Role = "user", Text = text });
        // A store's list reached through the type's name (a capital S, read without case).
        ChatStore.Messages.Add(new ChatMessage { Role = "assistant", Text = reply });
        // A store named for chat messages.
        chatStore.Add(new ChatMessage { Text = text });
        chatStore.AddRange([new ChatMessage { Text = reply }]);
        // A collection bound to the page.
        _messageCollection.Add(new ChatMessage { Role = "user", Text = text });
        chatMessageCollection.Add(new ChatMessage { Text = reply });
    }
}

public class ChatGrid(StateContainer container, RowTable table)
{
    public void Show(string text)
    {
        container.Add(new ChatMessage { Text = text });
        table.AddRange(new[] { new ChatMessage { Role = "assistant", Text = text } });
    }
}
