// lexcode-expect: 8
import AdSupport
import AppTrackingTransparency
import UIKit

extension String {
    func hashedForUpload() async throws -> String { self }
}

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

    func hashedAdvertisingID() async throws -> String {
        try await ASIdentifierManager.shared().advertisingIdentifier.uuidString.hashedForUpload()
    }

    func maybeHashedAdvertisingID() async -> String? {
        try? await ASIdentifierManager.shared().advertisingIdentifier.uuidString.hashedForUpload()
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

    func askThrowing() async throws {
        let status = try await ATTrackingManager.requestTrackingAuthorization()
        print(status.rawValue)
    }
}
