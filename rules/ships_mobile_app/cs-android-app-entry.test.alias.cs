// lexcode-expect: 2
// A .NET for Android app with no MAUI: the launcher activity reaches Android.App through an alias,
// and a second launcher entry names the attribute in full.
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
