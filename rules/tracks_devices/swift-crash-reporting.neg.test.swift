// lexcode-expect: 0
import UIKit
import MetricKit

// The nearest lookalike: Apple's MetricKit hands the app its own crash and hang diagnostics on
// the device, with no third-party service and no installation id of a vendor's.
final class Diagnostics: NSObject, MXMetricManagerSubscriber {
    func start() {
        MXMetricManager.shared.add(self)
    }

    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            print(payload.crashDiagnostics?.count ?? 0)
        }
    }
}
