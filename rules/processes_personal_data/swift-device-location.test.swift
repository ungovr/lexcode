// lexcode-expect: 7
import CoreLocation
import UIKit

final class NearbyLocator: NSObject, CLLocationManagerDelegate {
    private let manager: CLLocationManager
    private var optionalManager: CLLocationManager?

    init(manager: CLLocationManager = .init()) {
        self.manager = manager
        super.init()
        manager.delegate = self
    }

    func start() {
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
        optionalManager?.requestLocation()
        CLLocationManager().startMonitoringSignificantLocationChanges()
        manager
            .startMonitoringVisits()
    }

    func stream() async throws {
        for try await update in CLLocationUpdate.liveUpdates() {
            print(update.location as Any)
        }
        let updates = CLLocationUpdate.liveUpdates(.otherNavigation)
        print(updates)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        manager.requestLocation()
    }
}
