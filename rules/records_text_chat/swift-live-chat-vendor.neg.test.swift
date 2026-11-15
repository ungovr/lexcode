// lexcode-expect: 0
import UIKit
import FirebaseAnalytics
import Sentry

// Support surfaces that are not a chat, and app types with a chat vendor's generic short name: a
// help-center article viewer, analytics and crash reporting started by name like the chat SDKs, a
// door-entry intercom, and the app's own ChatClient for its websocket. This file imports none of the
// chat vendors' modules.
final class ChatClient {
    init(config: ChatClientConfig) {}
}

final class Intercom {
    static func ring(unit: String) {}
    static func present() {}
}

final class SupportScreen {
    func start() {
        SentrySDK.start { options in options.dsn = "https://example@sentry.invalid/1" }
        Analytics.logEvent("support_opened", parameters: nil)
        let client = ChatClient(config: ChatClientConfig(apiKey: "key"))
        _ = client
        Intercom.ring(unit: "4B")
        Intercom.present()
    }
}
