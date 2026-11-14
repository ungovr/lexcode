// lexcode-expect: 0
// Device facts that identify no one device: the model and platform, the carrier's name, the
// tracking-permission status read without asking, and the app's own AdvertisingIdClient class (a
// client for the shop's own ad campaigns), which shares the library's short name.
using Microsoft.Maui.Devices;

namespace Demo.Campaigns;

public class Diagnostics(Android.Telephony.TelephonyManager telephony)
{
    public string Describe() => $"{DeviceInfo.Current.Manufacturer} {DeviceInfo.Current.Model} on {DeviceInfo.Platform}";

    public string? Carrier() => telephony.NetworkOperatorName;

    public bool MayTrack() =>
        AppTrackingTransparency.ATTrackingManager.TrackingAuthorizationStatus == AppTrackingTransparency.ATTrackingManagerAuthorizationStatus.Authorized;
}

// The app's own class of the same short name.
public static class AdvertisingIdClient
{
    public static string GetAdvertisingIdInfo(string campaign) => "campaign:" + campaign;
}

public class CampaignReport
{
    public string Header() => AdvertisingIdClient.GetAdvertisingIdInfo("spring-sale");
}
