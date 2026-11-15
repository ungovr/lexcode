// lexcode-expect: 0
import Foundation
import os

// The app's own types with the vendors' generic short names, in a file without any vendor
// import: an in-house event log that stays on the device.
enum Analytics {
    static func logEvent(_ name: String, parameters: [String: Any]?) {
        Logger().info("\(name)")
    }
    static func setUserID(_ id: String?) {}
    static func shared() -> EventLog { EventLog() }
    static func setup(with config: String) {}
}

struct AppEvents {
    static let shared = EventLog()
}

final class EventLog {
    func track(_ name: String) {}
    func track(name: String) {}
    func logEvent(_ name: String) {}
    func identify(userId: String) {}
}

enum TelemetryManager {
    static func send(_ signal: String) {}
}

final class LocalMetrics {
    let log = EventLog()

    func record(userID: String) {
        Analytics.logEvent("screen_view", parameters: nil)
        Analytics.setUserID(userID)
        Analytics.shared().track("Signed In")
        Analytics.setup(with: "local")
        AppEvents.shared.logEvent("purchase")
        TelemetryManager.send("launched")
        log.track(name: "Signed In")
        log.identify(userId: userID)
    }

    // A first-party page view counted on our own server, with no third-party id.
    func pageView() -> URL? {
        URL(string: "https://metrics.example.org/collect?page=home")
    }
}
