// lexcode-expect: 9
import UIKit
import Amplitude
import TelemetryClient
import Segment

// The earlier SDKs: Amplitude-iOS, TelemetryDeck's TelemetryClient package and analytics-ios.
final class LegacyTracking {
    func start(userID: String) throws {
        Amplitude.instance().initializeApiKey("amp-key")
        try Amplitude.instance().logEvent("app_open")
        Amplitude.instance().setUserId(userID)
        TelemetryManager.initialize(with: TelemetryManagerConfiguration(appID: "td-app"))
        TelemetryManager.send("app.launched")
        Analytics.setup(with: AnalyticsConfiguration(writeKey: "seg-key"))
        Analytics.shared().track("Signed In")
    }

    func awaited() async throws {
        try await Amplitude.instance().logEvent("synced")
        try? await Analytics.shared().track("Synced")
    }
}
