// lexcode-expect: 0
// No window a member of the public opens: a staff-only app (the definition's exclusion), a widget
// extension and a server with no screen of its own (an API), and an app's own App protocol and
// WindowGroup function in a file that does not import SwiftUI (Review Focus 1).
import Foundation
import WidgetKit

protocol App {
    associatedtype Body
    var body: Body { get }
}

func WindowGroup(_ make: () -> Void) -> String { "group" }

// The same names as SwiftUI's, defined by the app, with no SwiftUI import.
struct LauncherApp: App {
    var body: String {
        WindowGroup {
            print("not a scene")
        }
    }
}

// A widget extension's entry point holds widgets, not an app window.
@main
struct StatusWidgets: WidgetBundle {
    var body: some Widget {
        StatusWidget()
    }
}

// A server process: an API with no screen of its own.
struct ServerMain {
    static func main() async throws {
        let server = HTTPServer(port: 8080)
        try await server.run()
    }
}
