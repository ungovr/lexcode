// lexcode-expect: 0
import UIKit

// The identifier kept in a stored property and only saved on the device, a local of the same name
// that shadows it in a method and holds something else, and a property set from another value.
final class Keeper {
    let deviceID = UIDevice.current.identifierForVendor?.uuidString ?? ""
    let token = "abc"

    func keep() {
        UserDefaults.standard.set(deviceID, forKey: "device")
    }

    func unlock(lockID: String) -> URLRequest {
        let deviceID = lockID
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        request.setValue(token, forHTTPHeaderField: "X-Token")
        return request
    }
}
