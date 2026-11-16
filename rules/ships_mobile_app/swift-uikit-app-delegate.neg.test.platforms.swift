// lexcode-expect: 0
import UIKit

// Delegates compiled only for Apple TV or Vision Pro, a delegate whose code is marked unavailable
// on iOS, and a library's open base class that apps subclass. None is a phone or tablet app's own
// delegate.
#if os(tvOS)
@main
final class TVDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        #if DEBUG
        print("debug build")
        #else
        print("release build")
        #endif
        return true
    }
}
#elseif os(visionOS)
final class VisionDelegate: UIResponder, UIApplicationDelegate {
}
#endif

open class BaseAppDelegate: UIResponder, UIApplicationDelegate {
    open func configure() {}
}
