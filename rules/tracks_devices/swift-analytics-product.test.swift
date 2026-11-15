// lexcode-expect: 16
import UIKit
import Mixpanel
import AmplitudeSwift
import TelemetryDeck
import PostHog

final class ProductAnalytics {
    let amplitude = Amplitude(configuration: Configuration(apiKey: "amp-key"))
    let qualified = AmplitudeSwift.Amplitude(configuration: Configuration(apiKey: "amp-key"))
    let mixpanel: MixpanelInstance

    init(mixpanel: MixpanelInstance) {
        self.mixpanel = mixpanel
    }

    func mixpanelCalls(userID: String) throws {
        Mixpanel.initialize(token: "mp-token", trackAutomaticEvents: true)
        Mixpanel.mainInstance().track(event: "Signed Up")
        Mixpanel.mainInstance()
            .identify(distinctId: userID)
        mixpanel.track(event: "Opened", properties: ["source": "push"])
        mixpanel.identify(distinctId: userID)
    }

    func amplitudeCalls(userID: String) {
        amplitude.track(eventType: "Song Played")
        amplitude.setUserId(userId: userID)
    }

    func others() {
        TelemetryDeck.initialize(config: .init(appID: "td-app"))
        TelemetryDeck.signal("app.launched")
        PostHogSDK.shared.setup(PostHogConfig(apiKey: "ph-key"))
        PostHogSDK.shared.capture("checkout")
    }

    // The awaited and optional-try forms.
    func awaited(userID: String) async throws {
        try await Mixpanel.mainInstance().track(event: "Synced")
        try await PostHogSDK.shared.capture("synced")
        try? await amplitude.track(eventType: "Synced")
    }
}
