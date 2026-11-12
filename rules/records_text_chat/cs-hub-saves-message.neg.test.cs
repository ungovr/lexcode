// lexcode-expect: 0
// A SignalR hub that only relays what is sent, one that saves a position and a connection rather than a message, and
// the app's own Hub class (a device-telemetry hub in the app's namespace), which is not SignalR's.
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

public class TelemetryHub(MessageStore messageStore) : Hub
{
    public Task Report(string reading) => messageStore.SaveAsync(reading);
}
