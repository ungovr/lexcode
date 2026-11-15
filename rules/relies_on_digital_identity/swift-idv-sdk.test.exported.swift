// lexcode-expect: 2
import UIKit

// The vendors reached through an `@_exported import Onfido` and `@_exported import Veriff` in
// another file of the module: the short names carry the vendors' own names.
final class KYCCoordinator {
    func start(config: OnfidoConfig, url: String, host: UIViewController) async throws {
        try await OnfidoFlow(withConfiguration: config).run()
        VeriffSdk.shared.startAuthentication(sessionUrl: url, presentingFrom: host)
    }
}
