// lexcode-expect: 8
// Identifiers that follow one device: the advertising id on Android, iOS and Windows, a request
// for permission to track on iOS, and the IMEI, subscriber id and hardware serial on Android.
using Android.Gms.Ads.Identifier;
using Android.Telephony;
using AdSupport;
using AppTrackingTransparency;
using WinAds = Windows.System.UserProfile;

namespace Demo.Mobile;

public class AdIds
{
    public string? Android(Android.Content.Context context) => AdvertisingIdClient.GetAdvertisingIdInfo(context).Id;

    public string Ios() => ASIdentifierManager.SharedManager.AdvertisingIdentifier.AsString();

    public Task<ATTrackingManagerAuthorizationStatus> Ask() => ATTrackingManager.RequestTrackingAuthorizationAsync();

    public string Windows() => WinAds.AdvertisingManager.AdvertisingId;
}

public class HardwareIds(TelephonyManager telephony)
{
    public string? Imei() => telephony.Imei;

    public string? Subscriber() => telephony.SubscriberId;

    public string? Slot(int slot) => telephony.GetImei(slot);

    public string Serial() => Android.OS.Build.GetSerial();
}
