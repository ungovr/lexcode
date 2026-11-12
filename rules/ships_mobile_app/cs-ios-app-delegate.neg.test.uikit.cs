// lexcode-expect: 0
// UIKit delegates of apps that are not iPhone or iPad apps: a .NET for tvOS app (Apple TV) and a
// .NET for Mac Catalyst app with no MAUI, a desktop build. Both derive from UIKit's
// UIApplicationDelegate exactly as an iOS app does.
using Foundation;
using UIKit;

namespace Contoso.Screens;

[Register("AppDelegate")]
public class TvAppDelegate : UIApplicationDelegate
{
    public override UIWindow? Window { get; set; }

    public override bool FinishedLaunching(UIApplication application, NSDictionary launchOptions)
    {
        Window = new UIWindow(UIScreen.MainScreen.Bounds);
        Window.MakeKeyAndVisible();
        return true;
    }
}

[Register("CatalystAppDelegate")]
public class CatalystAppDelegate : UIKit.UIApplicationDelegate
{
    public override bool FinishedLaunching(UIApplication application, NSDictionary launchOptions) => true;
}
