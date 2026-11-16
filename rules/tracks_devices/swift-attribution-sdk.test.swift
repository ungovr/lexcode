// lexcode-expect: 7
import UIKit
import AppsFlyerLib
import AdjustSdk
import FBSDKCoreKit

final class Attribution {
    func start(userID: String) {
        AppsFlyerLib.shared().start()
        AppsFlyerLib.shared().customerUserID = userID
        Adjust.initSdk(ADJConfig(appToken: "adj", environment: ADJEnvironmentProduction))
        AppEvents.shared.logEvent(.completedRegistration)
    }

    // The awaited and optional-try forms.
    func awaited() async throws {
        try await AppEvents.shared.logEvent(.completedTutorial)
        try await AppsFlyerLib.shared().logEvent("synced", withValues: [:])
        try? await Adjust.trackEvent(ADJEvent(eventToken: "abc"))
    }
}
