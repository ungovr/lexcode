// lexcode-expect: 0
import UIKit
import FirebaseAnalytics
import FirebaseCrashlytics

// With the real SDKs imported: turning collection off and clearing the user id at sign-out is
// the opposite of following the device.
final class PrivacySettings {
    func signOut() async throws {
        Analytics.setUserID(nil)
        Analytics.setUserID("")
        Crashlytics.crashlytics().setUserID("")
        try await Crashlytics.crashlytics().setUserID("")
        Analytics.setAnalyticsCollectionEnabled(false)
        Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(false)
    }
}
