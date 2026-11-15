// lexcode-expect: 10
import UIKit

// No vendor import here: the SDKs come in through an `@_exported import` in another file or an
// Objective-C bridging header. Only the short names that carry the vendor's own name are read.
final class ExportedTracking {
    func start(userID: String) throws {
        Mixpanel.initialize(token: "mp-token", trackAutomaticEvents: false)
        try Mixpanel.mainInstance().track(event: "Opened")
        Crashlytics.crashlytics().setUserID(userID)
        TelemetryDeck.signal("opened")
        PostHogSDK.shared.identify(userID)
        AppsFlyerLib.shared().logEvent("af_login", withValues: [:])
        Adjust.trackEvent(ADJEvent(eventToken: "abc"))
        SentrySDK.start(options: ["dsn": "https://key@o0.ingest.sentry.io/0"])
        Bugsnag.start(withApiKey: "bugsnag-key")
        let amplitude = Amplitude(configuration: Configuration(apiKey: "amp-key"))
        print(amplitude)
    }
}
