// lexcode-expect: 0
import Foundation

// The app's own types with UIKit's and SwiftUI's names, in a file that imports neither UIKit nor
// SwiftUI: a command-line tool's lifecycle protocol, its own launcher function and its own
// adaptor property wrapper.
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

@propertyWrapper
struct UIApplicationDelegateAdaptor<T> {
    var wrappedValue: T
    init(_ type: T.Type, value: T) { wrappedValue = value }
}

struct Boot {
    @UIApplicationDelegateAdaptor(Launcher.self, value: Launcher()) var launcher

    func run() {
        _ = UIApplicationMain(CommandLine.argc, 0)
    }
}
