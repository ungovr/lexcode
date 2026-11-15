// lexcode-expect: 0
import CoreLocation
import UIKit

// The nearest lookalikes with Core Location imported: a compass that reads only the heading,
// a fixed venue address turned into coordinates, and an authorization status check. None of
// them is the person's position.
final class CompassViewController: UIViewController, CLLocationManagerDelegate {
    let manager = CLLocationManager()
    let geocoder = CLGeocoder()

    override func viewDidLoad() {
        super.viewDidLoad()
        manager.delegate = self
        manager.startUpdatingHeading()
        geocoder.geocodeAddressString("1 Dr Carlton B Goodlett Pl, San Francisco") { placemarks, _ in
            print(placemarks?.first?.location as Any)
        }
        if manager.authorizationStatus == .denied {
            manager.stopUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        print(newHeading.magneticHeading)
    }
}
