// lexcode-expect: 2
import UIKit

// No vendor import here: the SDKs come in through an `@_exported import` in another file or a
// bridging header. SentrySDK and Bugsnag carry the vendor's own name.
final class ExportedCrashReporting {
    func start() {
        SentrySDK.start(options: ["dsn": "https://key@o0.ingest.sentry.io/0"])
        Bugsnag.start(withApiKey: "bugsnag-key")
    }
}
