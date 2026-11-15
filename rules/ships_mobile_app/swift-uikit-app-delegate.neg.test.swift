// lexcode-expect: 0
import Foundation

// The app's own types with UIKit's names, in a file that imports neither UIKit nor SwiftUI: a
// command-line tool's lifecycle protocol and its own launcher function.
protocol UIApplicationDelegate {
    func didLaunch()
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func didLaunch() {}
}

final class Launcher: UIApplicationDelegate {
    func didLaunch() {}
}

extension Launcher: CustomStringConvertible {
    var description: String { "launcher" }
}

func UIApplicationMain(_ argc: Int32, _ argv: Int) -> Int32 {
    return 0
}

struct Boot {
    func run() {
        _ = UIApplicationMain(CommandLine.argc, 0)
    }
}
