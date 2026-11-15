// lexcode-expect: 3
import UIKit
import SwiftUI
#if os(tvOS)
import TVUIKit
#endif

// One codebase built for iPhone and for Apple TV or Vision Pro: the phone delegate in the `#else`
// branch, a delegate shared by iOS and tvOS, and a SwiftUI app whose immersive space is visionOS's
// only. The file names `os(...)` conditions, so its tvOS import and visionOS scene do not drop it;
// the tvOS-only delegate in the `#if os(tvOS)` branch is dropped.
#if os(tvOS)
final class TVDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        #if DEBUG
        print("tv debug")
        #endif
        return true
    }
}
#else
final class PhoneDelegate: UIResponder, UIApplicationDelegate {
}
#endif

#if os(iOS) || os(tvOS)
final class SharedDelegate: UIResponder, UIApplicationDelegate {
}
#endif

struct GalleryApp: App {
    @UIApplicationDelegateAdaptor(PhoneDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            Text("Gallery")
        }
        #if os(visionOS)
        ImmersiveSpace(id: "gallery") {
            Text("Immersive")
        }
        #endif
    }
}
