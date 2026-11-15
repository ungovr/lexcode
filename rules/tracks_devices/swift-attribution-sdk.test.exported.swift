// lexcode-expect: 3
import UIKit

// No vendor import here: AppsFlyer and Adjust come in through an `@_exported import` in another
// file or a bridging header. Both short names carry the vendor's own name.
final class ExportedAttribution {
    func start() async throws {
        AppsFlyerLib.shared().logEvent("af_login", withValues: [:])
        Adjust.trackEvent(ADJEvent(eventToken: "abc"))
        try await AppsFlyerLib.shared().start()
    }
}
