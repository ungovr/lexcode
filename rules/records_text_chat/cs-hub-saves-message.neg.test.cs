// lexcode-expect: 0
// A SignalR hub that only relays what is sent, one that saves a position and a connection rather than a message, one
// that creates a chat room, saves a notification and opens a chat with no text in it, and the app's own Hub class (a
// device-telemetry hub in the app's namespace), which is not SignalR's.
using App.Devices;

namespace App.Realtime;

public class RelayHub : Microsoft.AspNetCore.SignalR.Hub
{
    private static readonly List<string> _messages = [];

    public async Task Send(string user, string message)
    {
        _messages.Add(message);
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}

public class TrackingHub(TrackingDb db, PresenceStore presence) : Microsoft.AspNetCore.SignalR.Hub
{
    public async Task Move(double lat, double lng)
    {
        db.Locations.Add(new Location { Lat = lat, Lng = lng });
        await presence.SaveAsync(Context.ConnectionId);
        await db.SaveChangesAsync();
    }
}

public class RoomHub(AppDb db, IChatService svc, INotifier notifier) : Microsoft.AspNetCore.SignalR.Hub
{
    public async Task CreateRoom(string name)
    {
        await db.ChatRooms.AddAsync(new ChatRoom { Name = name });
        await db.SaveChangesAsync();
    }

    public async Task Notify(string text)
    {
        db.Add(new NotificationMessage { Text = text });
        await notifier.AddNotificationMessageAsync(text);
        await db.SaveChangesAsync();
    }

    public async Task Open() => await svc.CreateChatAsync(Context.UserIdentifier!);
}

public class TelemetryHub(MessageStore messageStore) : Hub
{
    public Task Report(string reading) => messageStore.SaveAsync(reading);
}
