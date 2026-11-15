// lexcode-expect: 0
import UIKit
import TVUIKit

// An Apple TV app: its UIKit delegate in a file that imports a framework only tvOS has. A TV app is
// not a phone or tablet app.
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let poster = TVPosterView(image: nil)
        window?.rootViewController?.view.addSubview(poster)
        return true
    }
}
