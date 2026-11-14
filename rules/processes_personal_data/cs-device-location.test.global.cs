// lexcode-expect: 3
// A .NET MAUI file under the SDK's implicit usings (Microsoft.Maui.Devices.Sensors), so it has no
// using at all: only the short forms of Geolocation and IGeolocation can match here.
namespace Demo.Mobile;

public class StoreFinder(IGeolocation geolocation)
{
    public Task<Location?> Nearest() => Geolocation.Default.GetLocationAsync(new GeolocationRequest(GeolocationAccuracy.Medium));

    public Task<Location?> Last() => Geolocation.GetLastKnownLocationAsync();

    public Task<Location?> Now() => geolocation.GetLocationAsync();
}
