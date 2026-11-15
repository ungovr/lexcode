// lexcode-expect: 0
import SwiftUI
import AppKit

// A macOS-only app is a desktop app, not a mobile one: an AppKit application delegate and a
// SwiftUI app that adapts it, with a Settings scene only macOS has.
final class MacDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {}
}

@main
struct DeskApp: App {
    @NSApplicationDelegateAdaptor(MacDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            Text("Desk")
        }
        Settings {
            Text("Preferences")
        }
    }
}
