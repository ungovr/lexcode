// lexcode-expect: 3
import SwiftUI

// A SwiftUI app on iOS: its UIKit delegate reached through SwiftUI's umbrella import (no
// `import UIKit` in the file), and the adaptor that installs it, with and without arguments.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        true
    }
}

@main
struct CountriesApp: App {
    #if os(iOS)
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    #endif

    var body: some Scene {
        WindowGroup {
            Text("Countries")
        }
    }
}

struct SecondApp {
    @UIApplicationDelegateAdaptor var delegate: AppDelegate
}
