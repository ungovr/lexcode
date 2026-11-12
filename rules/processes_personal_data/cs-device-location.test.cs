// lexcode-expect: 8
// Reading the person's precise location from the device: .NET MAUI and Xamarin.Essentials
// geolocation (static, injected and aliased), the Android location manager, Core Location on
// iOS, and the Windows geolocator.
using Microsoft.Maui.Devices.Sensors;
using Essentials = Xamarin.Essentials;
using Droid = Android.Locations;

namespace Demo.Mobile;

public class StoreFinder
{
    public async Task<Location?> Nearest()
    {
        var request = new GeolocationRequest(GeolocationAccuracy.Medium, TimeSpan.FromSeconds(10));
        return await Geolocation.Default.GetLocationAsync(request);
    }

    public Task<Location?> Last() => Geolocation.GetLastKnownLocationAsync();
}

public class Tracker(IGeolocation geolocation)
{
    public Task<bool> Start() => geolocation.StartListeningForegroundAsync(new GeolocationListeningRequest());

    public Task<Location?> Now() => geolocation.GetLocationAsync();
}

public class LegacyFinder
{
    public Task<Essentials.Location> Find() => Essentials.Geolocation.GetLocationAsync();
}

public class AndroidTracker
{
    private readonly Droid.LocationManager _locations;

    public AndroidTracker(Droid.LocationManager locations)
    {
        _locations = locations;
    }

    public Droid.Location? Last() => _locations.GetLastKnownLocation(Droid.LocationManager.GpsProvider);
}

public class IosTracker
{
    private readonly CoreLocation.CLLocationManager _manager = new();

    public void Start() => _manager.StartUpdatingLocation();
}

public class WindowsTracker
{
    public async Task<double> Latitude()
    {
        Windows.Devices.Geolocation.Geolocator locator = new();
        var position = await locator.GetGeopositionAsync();
        return position.Coordinate.Point.Position.Latitude;
    }
}
