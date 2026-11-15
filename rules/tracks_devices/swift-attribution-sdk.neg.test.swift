// lexcode-expect: 0
import Foundation

// The app's own AppEvents type with Meta's generic short name, in a file without FBSDKCoreKit or
// FacebookCore: an in-house event bus.
struct AppEvents {
    static let shared = EventBus()
}

final class EventBus {
    func logEvent(_ name: String) {}
    func activateApp() {}
}

final class Launch {
    func run() async {
        AppEvents.shared.logEvent("purchase")
        AppEvents.shared.activateApp()
        try? await Task.sleep(nanoseconds: 1)
    }
}
