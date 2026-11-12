// lexcode-expect: 0
// Android and MAUI code that is not the entry of an installable app: a secondary activity (the
// sign-in callback every MAUI app with web sign-in has), an activity that is explicitly not the
// launcher, the cross-platform App class and Windows head of a MAUI app (a desktop build), and the
// Tizen head of a MAUI app (Samsung televisions and watches), which subclasses MauiApplication with
// no Android [Application] attribute.
using Android.App;
using Android.Content.PM;

namespace Contoso.Field.Platforms;

[Activity(NoHistory = true, LaunchMode = LaunchMode.SingleTop, Exported = true)]
[IntentFilter(new[] { Android.Content.Intent.ActionView },
    Categories = new[] { Android.Content.Intent.CategoryDefault, Android.Content.Intent.CategoryBrowsable },
    DataScheme = "contoso",
    DataHost = "authcallback")]
public class SignInCallbackActivity : Microsoft.Maui.Authentication.WebAuthenticatorCallbackActivity
{
}

[Activity(Label = "Settings", MainLauncher = false)]
public class SettingsActivity : Activity
{
}

public partial class App : Microsoft.Maui.Controls.Application
{
    public App() => InitializeComponent();
}

public partial class WindowsApp : MauiWinUIApplication
{
    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}

internal class TizenProgram : MauiApplication
{
    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

    static void Main(string[] args)
    {
        var app = new TizenProgram();
        app.Run(args);
    }
}
