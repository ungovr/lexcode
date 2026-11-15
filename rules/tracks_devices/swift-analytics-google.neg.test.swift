// lexcode-expect: 0
import Foundation
import os

// The app's own Analytics type with Firebase's generic short name, in a file without any vendor
// import: an in-house event log that stays on the device.
enum Analytics {
    static func logEvent(_ name: String, parameters: [String: Any]?) {
        Logger().info("\(name)")
    }
    static func setUserID(_ id: String?) {}
    static func appInstanceID() -> String? { nil }
}

final class LocalMetrics {
    func record(userID: String) async throws {
        Analytics.logEvent("screen_view", parameters: nil)
        Analytics.setUserID(userID)
        print(Analytics.appInstanceID() ?? "")
        try? await Analytics.logEvent("synced", parameters: nil)
    }

    // A first-party page view counted on our own server, with no third-party id.
    func pageView() -> URL? {
        URL(string: "https://metrics.example.org/collect?page=home")
    }
}
