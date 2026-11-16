// lexcode-expect: 6
import UIKit

// No vendor import here: the SDKs come in through an `@_exported import` in another file or an
// Objective-C bridging header. Only the short names that carry the vendor's own name are read.
final class ExportedProductAnalytics {
    func start(userID: String) async throws {
        Mixpanel.initialize(token: "mp-token", trackAutomaticEvents: false)
        try Mixpanel.mainInstance().track(event: "Opened")
        try await Mixpanel.mainInstance().track(event: "Synced")
        TelemetryDeck.signal("opened")
        PostHogSDK.shared.identify(userID)
        let amplitude = Amplitude(configuration: Configuration(apiKey: "amp-key"))
        print(amplitude)
    }
}
