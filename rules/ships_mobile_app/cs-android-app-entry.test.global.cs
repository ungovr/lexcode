// lexcode-expect: 2
// A .NET MAUI app's Android head with no `using` lines at all: Android.App and Microsoft.Maui come
// from the SDKs' implicit global usings, so only the short attribute and base-class forms see them.
namespace Contoso.Field;

[Activity(Label = "Field", MainLauncher = true)]
public class MainActivity : MauiAppCompatActivity
{
}

[Application]
public class MainApplication : MauiApplication
{
    public MainApplication(IntPtr handle, Android.Runtime.JniHandleOwnership ownership)
        : base(handle, ownership)
    {
    }

    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
