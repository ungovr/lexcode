// lexcode-expect: 31
import UIKit
import FirebaseAnalytics
import FirebaseCrashlytics
import Mixpanel
import AmplitudeSwift
import TelemetryDeck
import PostHog
import Sentry
import Bugsnag
import AppsFlyerLib
import AdjustSdk
import FBSDKCoreKit

final class AppAnalytics {
    let amplitude = Amplitude(configuration: Configuration(apiKey: "amp-key"))
    let qualified = AmplitudeSwift.Amplitude(configuration: Configuration(apiKey: "amp-key"))
    let mixpanel: MixpanelInstance

    init(mixpanel: MixpanelInstance) {
        self.mixpanel = mixpanel
    }

    func firebase(userID: String) {
        Analytics.logEvent("screen_view", parameters: ["screen_name": "home"])
        Analytics.setUserID(userID)
        Analytics.setUserProperty("pro", forName: "plan")
        let installID = Analytics.appInstanceID()
        print(installID ?? "")
        Crashlytics.crashlytics().setUserID(userID)
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

    func others(userID: String) async throws {
        TelemetryDeck.initialize(config: .init(appID: "td-app"))
        TelemetryDeck.signal("app.launched")
        PostHogSDK.shared.setup(PostHogConfig(apiKey: "ph-key"))
        PostHogSDK.shared.capture("checkout")
        AppsFlyerLib.shared().start()
        AppsFlyerLib.shared().customerUserID = userID
        Adjust.initSdk(ADJConfig(appToken: "adj", environment: ADJEnvironmentProduction))
        AppEvents.shared.logEvent(.completedRegistration)
        SentrySDK.start { options in
            options.dsn = "https://key@o0.ingest.sentry.io/0"
        }
        Bugsnag.start()
        let hit = URL(string: "https://www.google-analytics.com/mp/collect?measurement_id=G-1&api_secret=s")
        print(hit as Any)
    }

    // The awaited and optional-try forms, written as an SDK's async wrapper is called: each chain
    // is matched by its head, which the engine resolves under `try await`.
    func awaited(userID: String) async throws {
        try await Mixpanel.mainInstance().track(event: "Synced")
        try await Crashlytics.crashlytics().setUserID(userID)
        try await PostHogSDK.shared.capture("synced")
        try await AppEvents.shared.logEvent(.completedTutorial)
        try await AppsFlyerLib.shared().logEvent("synced", withValues: [:])
        try? await Analytics.logEvent("synced", parameters: nil)
    }
}
