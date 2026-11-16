// lexcode-expect: 0
import Foundation

// The app's own types with Segment's and TelemetryClient's generic short names, and an event log
// with the vendors' method shapes, in a file without any vendor import: an in-house log that
// stays on the device.
enum Analytics {
    static func shared() -> EventLog { EventLog() }
    static func setup(with config: String) {}
}

final class EventLog {
    func track(_ name: String) {}
    func track(name: String) {}
    func track(event: String) {}
    func identify(userId: String) {}
    func identify(distinctId: String) {}
    func setUserId(userId: String?) {}
}

enum TelemetryManager {
    static func send(_ signal: String) {}
    static func initialize(with id: String) {}
}

final class LocalMetrics {
    let log = EventLog()

    func record(userID: String) async throws {
        Analytics.shared().track("Signed In")
        Analytics.setup(with: "local")
        TelemetryManager.initialize(with: "local")
        TelemetryManager.send("launched")
        log.track(name: "Signed In")
        log.track(event: "Opened")
        log.identify(userId: userID)
        log.identify(distinctId: userID)
        log.setUserId(userId: userID)
        try? await Analytics.shared().track("Synced")
    }
}
