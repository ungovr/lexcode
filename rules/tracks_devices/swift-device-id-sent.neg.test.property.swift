// lexcode-expect: 0
import UIKit

// The identifier kept in a stored property and only saved on the device, a property set from another
// value, and every name that shadows the property in a member and holds something else: a local
// (`let` and `var`), a parameter with and without an argument label, an init's parameter, `if let`,
// `guard let`, a `for` variable and a closure parameter alone or second of two.
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

    func rewritten(lockID: String) -> URLRequest {
        var deviceID = lockID
        deviceID += "-lock"
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        return request
    }
}

final class LockClient {
    let deviceID = UIDevice.current.identifierForVendor?.uuidString ?? ""

    func unlock(deviceID: String) -> URLRequest {
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        return request
    }

    func labeled(for deviceID: String) -> URLRequest {
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        return request
    }

    func bound(lock: String?) -> URLRequest? {
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        if let deviceID = lock {
            request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        }
        if var deviceID = lock {
            deviceID += "-2"
            request.setValue(deviceID, forHTTPHeaderField: "X-Lock3")
        }
        guard let deviceID = lock else { return nil }
        request.addValue(deviceID, forHTTPHeaderField: "X-Lock2")
        return request
    }

    func each(locks: [String]) {
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        locks.forEach { deviceID in
            request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        }
        for deviceID in locks {
            request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        }
        Dictionary(uniqueKeysWithValues: locks.map { ($0, 1) }).forEach { deviceID, count in
            request.setValue("\(deviceID)-\(count)", forHTTPHeaderField: "X-Count")
        }
        locks.enumerated().forEach { index, deviceID in
            request.setValue(deviceID, forHTTPHeaderField: "X-\(index)")
        }
        print(request)
    }

    init(deviceID: String) {
        var request = URLRequest(url: URL(string: "https://locks.example.com/v1/unlock")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        print(request)
    }

}
