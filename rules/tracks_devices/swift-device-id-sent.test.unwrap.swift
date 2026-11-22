// lexcode-expect: 9
// The identifier kept in an optional stored property and unwrapped before it is sent: an unwrap of the
// property to its own name is the property, not a shadow (`if let`, `guard let`, the shorthand
// `guard let x else`, `if let x = self.x`), and a parameter of the same name does not hide a send of
// `self.<name>`.
import UIKit

final class Reporter {
    let deviceID = UIDevice.current.identifierForVendor?.uuidString

    func ifLet() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        if let deviceID = deviceID {
            request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        }
        return request
    }

    func guardLet() -> URLRequest? {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        guard let deviceID = deviceID else { return nil }
        request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        return request
    }

    func guardShorthand() -> URLRequest? {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        guard let deviceID else { return nil }
        request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        return request
    }

    func ifLetSelf() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        if let deviceID = self.deviceID {
            request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        }
        return request
    }

    func sameNamedParameter(deviceID: String) -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        request.setValue(self.deviceID, forHTTPHeaderField: "X-Device-Id")
        request.setValue(deviceID, forHTTPHeaderField: "X-Lock")
        return request
    }

    func ifShorthand() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        if let deviceID {
            request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        }
        return request
    }

    func ifVar() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        if var deviceID = deviceID {
            deviceID = deviceID.lowercased()
            request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        }
        return request
    }

    func ifVarSelf() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        if var deviceID = self.deviceID {
            deviceID += ""
            request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        }
        return request
    }

    func guardLetSelf() -> URLRequest? {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        guard let deviceID = self.deviceID else { return nil }
        request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        return request
    }
}
