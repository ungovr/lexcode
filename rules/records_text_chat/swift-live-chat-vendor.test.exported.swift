// lexcode-expect: 3
import UIKit

// No vendor import here: the SDKs come in through an `@_exported import` in another file or an
// Objective-C bridging header. Only short names that carry the vendor's own name, called with the
// vendor's own argument labels, are read.
final class ExportedSupportChat {
    func start() {
        Intercom.setApiKey("ios_sdk-key", forAppId: "app-id")
        Freshchat.sharedInstance().initWith(FreshchatConfig(appID: "app-id", andAppKey: "app-key"))
        CrispSDK.configure(websiteID: "website-id")
    }
}
