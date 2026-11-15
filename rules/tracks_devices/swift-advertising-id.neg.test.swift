// lexcode-expect: 0
import UIKit

// The app's own types with Apple's short names, in a file without AdSupport or
// AppTrackingTransparency: not the system advertising identifier.
final class ASIdentifierManager {
    static func shared() -> ASIdentifierManager { ASIdentifierManager() }
    var advertisingIdentifier: UUID { UUID() }
}

enum ATTrackingManager {
    static func requestTrackingAuthorization(completionHandler: @escaping (Int) -> Void) {
        completionHandler(0)
    }
}

final class NotificationSetup {
    func campaignID() -> UUID {
        ASIdentifierManager.shared().advertisingIdentifier
    }

    func askLocalConsent() {
        ATTrackingManager.requestTrackingAuthorization { status in
            print(status)
        }
    }

    // A push token identifies the installation only to deliver the notifications the person
    // asked for: needed to deliver the service, not tracking.
    func registerForPush() {
        UIApplication.shared.registerForRemoteNotifications()
    }

    // A session token kept for one visit and dropped at sign-out.
    func endSession(defaults: UserDefaults) {
        defaults.removeObject(forKey: "sessionToken")
    }
}
