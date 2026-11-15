// lexcode-expect: 5
import AdSupport
import AppTrackingTransparency
import UIKit

final class AdAttribution {
    func advertisingID() -> String {
        let idfa = ASIdentifierManager.shared().advertisingIdentifier
        return idfa.uuidString
    }

    func advertisingIDString() -> String {
        ASIdentifierManager.shared()
            .advertisingIdentifier
            .uuidString
    }

    func askWithClosure() {
        ATTrackingManager.requestTrackingAuthorization { status in
            print(status.rawValue)
        }
    }

    func askWithHandler() {
        ATTrackingManager.requestTrackingAuthorization(completionHandler: { status in
            print(status.rawValue)
        })
    }

    func askAsync() async {
        let status = await ATTrackingManager.requestTrackingAuthorization()
        print(status.rawValue)
    }
}
