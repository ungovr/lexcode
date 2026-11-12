// lexcode-expect: 3
// Android.App reached only through an alias: a .NET for Android launcher activity, a second launcher
// entry that names the attribute with global::, and a MAUI head whose Application attribute is
// aliased and whose MauiApplication base is named in full.
using Droid = Android.App;
using Android.OS;

namespace Contoso.Meter;

[Droid.Activity(Label = "Meter", MainLauncher = true, Icon = "@mipmap/icon")]
public class LauncherActivity : Droid.Activity
{
    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        SetContentView(Resource.Layout.activity_main);
    }
}

[global::Android.App.Activity(MainLauncher = true, Label = "Meter Lite")]
public class LiteLauncherActivity : Droid.Activity
{
}

[Droid.Application(Label = "Meter")]
public class MeterApplication : Microsoft.Maui.MauiApplication
{
    public MeterApplication(IntPtr handle, Android.Runtime.JniHandleOwnership ownership)
        : base(handle, ownership)
    {
    }

    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
