// lexcode-expect: 4
import Foundation
import Segment

final class SegmentTracker {
    let analytics = Analytics(configuration: Configuration(writeKey: "seg-key")
        .trackApplicationLifecycleEvents(true))

    func signedIn(userID: String) {
        analytics.identify(userId: userID)
        analytics.track(name: "Signed In", properties: ["method": "email"])
        analytics.screen(title: "Home")
    }
}
