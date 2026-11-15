// lexcode-expect: 5
import UIKit
import PassKit
import ProximityReader

// Verify with Wallet (an ID in the person's Apple Wallet, read by the app) and Tap to Present ID
// on iPhone (a business reads a customer's mobile ID at the counter).
final class AgeCheckViewController: UIViewController {
    func verifyWithWallet() async throws {
        let descriptor = PKIdentityDriversLicenseDescriptor()
        descriptor.addElements([.age(atLeast: 21)], intentToStore: .willNotStore)
        let request = PKIdentityRequest()
        request.descriptor = descriptor
        request.merchantIdentifier = "merchant.org.example"
        let document = try await PKIdentityAuthorizationController().requestDocument(request)
        print(document)
    }

    func verifyQualified() {
        let request = PassKit.PKIdentityRequest(
        )
        print(request)
    }

    func tapToPresent() async throws {
        let reader = MobileDocumentReader()
        let session = try await reader.prepare()
        let display = MobileDriversLicenseDisplayRequest(elements: [.givenName, .familyName, .portrait])
        _ = try await session.requestDocument(display)
        let data = try await session.requestDocument(MobileDriversLicenseDataRequest(elements: [.age(atLeast: 18)], retainedElements: []))
        let national = MobileNationalIDCardDisplayRequest(elements: [.givenName])
        print(data, national)
    }
}
