// lexcode-expect: 0
// Tools only staff use (the definition's exclusion), and a test host and a preview app, each with a
// real SwiftUI or UIKit window.
import SwiftUI
import UIKit

@main
struct AdminConsoleApp: App {
    var body: some Scene {
        WindowGroup {
            OrdersDashboard()
        }
    }
}

struct InternalToolsApp: App {
    var body: some Scene {
        WindowGroup {
            FeatureFlagsView()
        }
    }
}

struct TestHostApp: App {
    var body: some Scene {
        WindowGroup {
            EmptyView()
        }
    }
}

final class StaffSceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
}
