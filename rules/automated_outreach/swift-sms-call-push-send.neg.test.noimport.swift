// lexcode-expect: 0
import Foundation

// The app's own alert helper named like APNSwift's call, and its own `apns` settings object, in a
// file with no APNs import: an in-app banner, not a push from a server.
final class BannerCenter {
    let apns = APNSSettings()

    func sendAlertNotification(_ text: String) {
        banners.append(text)
    }

    func show(_ text: String) {
        self.sendAlertNotification(text)
        apns.send(.init(title: text), to: "local")
    }
}
