// lexcode-expect: 0
import UIKit

// A delegate marked unavailable on iOS: the code itself says it is not an iPhone or iPad app.
@available(iOS, unavailable)
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
}
