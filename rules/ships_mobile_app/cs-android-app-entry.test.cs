// lexcode-expect: 3
// The Android head of a .NET MAUI app: the launcher activity (MainLauncher = true puts the app in the
// device's launcher) and the Application class, written as the MAUI template writes them, where
// MauiApplication comes from the SDK's implicit global usings. A second app head names its
// Application base in full and implements an interface too.
using Android.App;
using Android.Content.PM;
using Android.Runtime;

namespace Contoso.Field;

[Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true,
    ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode)]
public class MainActivity : MauiAppCompatActivity
{
    protected override void OnResume()
    {
        base.OnResume();
        Platform.OnResume(this);
    }
}

[Application]
public class MainApplication : MauiApplication
{
    public MainApplication(IntPtr handle, JniHandleOwnership ownership)
        : base(handle, ownership)
    {
    }

    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}

[Application(Label = "Field Kiosk")]
public sealed class KioskApplication : Microsoft.Maui.MauiApplication, IDisposable
{
    public KioskApplication(IntPtr handle, JniHandleOwnership ownership)
        : base(handle, ownership)
    {
    }

    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
