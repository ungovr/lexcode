// lexcode-expect: 3
import UIKit
import Sentry
import Bugsnag

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        SentrySDK.start { options in
            options.dsn = "https://key@o0.ingest.sentry.io/0"
        }
        Bugsnag.start()
        return true
    }

    func restart() async throws {
        try await SentrySDK.start(options: ["dsn": "https://key@o0.ingest.sentry.io/0"])
    }
}
