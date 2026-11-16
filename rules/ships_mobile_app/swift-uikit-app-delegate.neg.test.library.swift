// lexcode-expect: 0
import UIKit

// UIKit code that is not an app: a library's helper that opens links through the running app and
// watches its lifecycle notifications, and a test double of an app delegate that a unit test
// installs. Neither is the object an installable app starts from.
public final class LinkOpener {
    public init() {}

    public func open(_ url: URL) async {
        await UIApplication.shared.open(url)
    }

    public func observe() {
        NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { _ in }
    }
}

final class MockAppDelegate: UIResponder, UIApplicationDelegate {
    var launched = false
}

final class AppDelegateStub: NSObject, UIApplicationDelegate {}
