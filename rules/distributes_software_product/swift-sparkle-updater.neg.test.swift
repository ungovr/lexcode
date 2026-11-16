// lexcode-expect: 0
import Foundation

// An app's own update types with Sparkle's names, in a file that does not import Sparkle, and an
// app that only asks its own server whether newer content is available: a hosted service's data,
// not a new build of the software.
final class SPUStandardUpdaterController {
    init(startingUpdater: Bool, updaterDelegate: AnyObject?, userDriverDelegate: AnyObject?) {}
}

final class SPUUpdater {
    init(hostBundle: Bundle) {}
}

final class SUUpdater {
    static func shared() -> SUUpdater? { SUUpdater() }
    func checkForUpdatesInBackground() {}
}

final class ContentRefresher {
    let controller = SPUStandardUpdaterController(startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil)
    let updater = SPUUpdater(hostBundle: Bundle.main)

    func refresh() async throws -> Data {
        SUUpdater.shared()?.checkForUpdatesInBackground()
        let url = URL(string: "https://api.example.org/content/latest")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}
