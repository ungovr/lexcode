// lexcode-expect: 0
import UIKit
import FirebaseAnalytics
import FirebaseCrashlytics
import AmplitudeSwift

// With the real SDKs imported: turning collection off and clearing the user id at sign-out is
// the opposite of following the device.
final class PrivacySettings {
    func signOut() {
        Analytics.setUserID(nil)
        Analytics.setUserID("")
        Crashlytics.crashlytics().setUserID("")
        Analytics.setAnalyticsCollectionEnabled(false)
        Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(false)
    }

    func signOut(amplitude: Amplitude) {
        amplitude.setUserId(userId: nil)
        amplitude.setUserId(userId: "")
    }
}
