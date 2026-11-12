// lexcode-expect: 0
// Apple and MAUI code that is not an iOS app's delegate: a macOS (AppKit) app delegate, which is a
// desktop app, the cross-platform App class of a MAUI app, a scene delegate, and a game engine's own
// UIApplicationDelegate and FormsApplicationDelegate in another namespace with the same short names.
using AppKit;
using Foundation;
using Contoso.Engine.Hosting;

namespace Contoso.Desk;

[Register("AppDelegate")]
public class AppDelegate : NSApplicationDelegate
{
    public override void DidFinishLaunching(NSNotification notification)
    {
    }
}

public partial class App : Microsoft.Maui.Controls.Application
{
    public App() => InitializeComponent();
}

public class SceneDelegate : UIKit.UIWindowSceneDelegate
{
}

public class EngineDelegate : UIApplicationDelegate
{
}

public class FormsHost : FormsApplicationDelegate
{
}
