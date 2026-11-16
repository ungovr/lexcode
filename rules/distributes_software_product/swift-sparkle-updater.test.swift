// lexcode-expect: 4
import Cocoa
import Sparkle

// A macOS app distributed outside the App Store that updates itself from its appcast: Sparkle 2's
// standard controller and its lower-level updater, and Sparkle 1's shared updater.
@main
final class AppDelegate: NSObject, NSApplicationDelegate {
    let updaterController = SPUStandardUpdaterController(startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil)
    var updater: SPUUpdater?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let driver = SPUStandardUserDriver(hostBundle: Bundle.main, delegate: nil)
        updater = SPUUpdater(hostBundle: Bundle.main, applicationBundle: Bundle.main, userDriver: driver, delegate: nil)
        try? updater?.start()
        SUUpdater.shared()?.checkForUpdatesInBackground()
    }

    // Under `try await`: the updater built inside the awaited call.
    func legacy(bundle: Bundle) async throws {
        let old = try await Self.prepared(SUUpdater(for: bundle))
        old?.checkForUpdates(nil)
    }

    static func prepared(_ updater: SUUpdater?) async throws -> SUUpdater? {
        updater
    }
}
