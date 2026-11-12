// lexcode-expect: 0
// Locations that are not the person's device position: a distance between two fixed points, a
// store's address geocoded from text the shop wrote, a permission check that reads nothing, and
// the app's own Geolocation and LocationManager classes, which share the library's short names.
using Microsoft.Maui.ApplicationModel;

namespace Demo.Stores;

public class Distances
{
    public double Between(double lat1, double lon1, double lat2, double lon2) =>
        Microsoft.Maui.Devices.Sensors.Location.CalculateDistance(lat1, lon1, lat2, lon2, Microsoft.Maui.Devices.Sensors.DistanceUnits.Kilometers);

    public Task<PermissionStatus> Allowed() => Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();
}

// The app's own classes of the same short names: a parser for coordinates typed into the store
// editor, and a registry of the shop's branch locations.
public static class Geolocation
{
    public static (double Lat, double Lon) Parse(string text)
    {
        var parts = text.Split(',');
        return (double.Parse(parts[0]), double.Parse(parts[1]));
    }
}

public class LocationManager
{
    public string GetLastKnownLocation(string branch) => branch + ": 1 Main Street";
}

public class BranchDirectory
{
    private readonly LocationManager _branches = new();

    public string Describe() => _branches.GetLastKnownLocation("north") + Geolocation.Parse("51.5,-0.1");
}
