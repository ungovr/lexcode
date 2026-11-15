// lexcode-expect: 0
import Foundation

// The app's own location manager in a file without Core Location: a simulator for a game map,
// with Apple's method names.
final class CLLocationManager {
    func startUpdatingLocation() {}
    func requestLocation() {}
}

enum CLLocationUpdate {
    static func liveUpdates() -> [String] { [] }
}

final class GameMap {
    let simulator = CLLocationManager()

    func run() {
        simulator.startUpdatingLocation()
        simulator.requestLocation()
        print(CLLocationUpdate.liveUpdates())
    }
}
