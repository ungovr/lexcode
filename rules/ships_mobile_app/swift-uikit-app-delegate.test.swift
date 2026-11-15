// lexcode-expect: 4
import UIKit

// A UIKit app's delegate in each place the conformance list may hold it, and one added by an
// extension.
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func refresh() async throws {
        try await Task.sleep(nanoseconds: 1)
    }
}

class PlainDelegate: UIApplicationDelegate {
}

@MainActor
final class ThirdDelegate: UIResponder, ObservableObject, UIApplicationDelegate {
}

final class LateDelegate: NSObject {
}

extension LateDelegate: UIApplicationDelegate {
    func applicationDidBecomeActive(_ application: UIApplication) {}
}
