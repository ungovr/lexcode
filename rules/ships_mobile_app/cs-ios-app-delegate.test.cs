// lexcode-expect: 3
// The iOS heads of two apps: a .NET MAUI app's AppDelegate as the template writes it (the base
// class comes from the MAUI SDK's implicit global usings) and named in full, and a Xamarin.Forms
// app's delegate reached through an alias.
using Foundation;
using UIKit;
using XfIos = Xamarin.Forms.Platform.iOS;

namespace Contoso.Field;

[Register("AppDelegate")]
public class AppDelegate : MauiUIApplicationDelegate
{
    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}

[Register("KioskAppDelegate")]
public sealed class KioskAppDelegate : Microsoft.Maui.MauiUIApplicationDelegate
{
    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}

[Register("LegacyAppDelegate")]
public partial class LegacyAppDelegate : XfIos.FormsApplicationDelegate
{
    public override bool FinishedLaunching(UIApplication app, NSDictionary options)
    {
        global::Xamarin.Forms.Forms.Init();
        LoadApplication(new App());
        return base.FinishedLaunching(app, options);
    }
}
