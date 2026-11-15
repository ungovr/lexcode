// lexcode-expect: 8
import UIKit
import FirebaseAnalytics
import FirebaseCrashlytics

final class GoogleAnalytics {
    func firebase(userID: String) {
        Analytics.logEvent("screen_view", parameters: ["screen_name": "home"])
        Analytics.setUserID(userID)
        Analytics.setUserProperty("pro", forName: "plan")
        let installID = Analytics.appInstanceID()
        print(installID ?? "")
        Crashlytics.crashlytics().setUserID(userID)
    }

    func measurementProtocol() -> URL? {
        URL(string: "https://www.google-analytics.com/mp/collect?measurement_id=G-1&api_secret=s")
    }

    // The awaited and optional-try forms: each chain is matched by its head, which the engine
    // resolves under `try await`.
    func awaited(userID: String) async throws {
        try await Crashlytics.crashlytics().setUserID(userID)
        try? await Analytics.logEvent("synced", parameters: nil)
    }
}
