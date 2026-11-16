// lexcode-expect: 0
import UIKit
import AmplitudeSwift
import Mixpanel
import Segment

// With the real SDKs imported: clearing the user id at sign-out is the opposite of following the
// device.
final class PrivacySettings {
    func signOut(amplitude: Amplitude, mixpanel: MixpanelInstance, analytics: Analytics) {
        amplitude.setUserId(userId: nil)
        amplitude.setUserId(userId: "")
        mixpanel.identify(distinctId: "")
        analytics.identify(userId: "")
    }
}
