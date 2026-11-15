// lexcode-expect: 5
import Foundation
import Segment

final class SegmentTracker {
    let analytics = Analytics(configuration: Configuration(writeKey: "seg-key")
        .trackApplicationLifecycleEvents(true))

    func signedIn(userID: String) async throws {
        analytics.identify(userId: userID)
        analytics.track(name: "Signed In", properties: ["method": "email"])
        analytics.screen(title: "Home")
        try await analytics.track(name: "Synced")
    }
}
