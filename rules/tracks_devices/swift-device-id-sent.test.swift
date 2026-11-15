// lexcode-expect: 5
import UIKit

final class DeviceReporter {
    func headerRequest() -> URLRequest {
        let deviceID = UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/sessions")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        return request
    }

    func queryURL() -> URL? {
        let vendorID = UIDevice.current.identifierForVendor?.uuidString ?? ""
        var components = URLComponents(string: "https://ads.example.net/attribution")
        components?.queryItems = [
            URLQueryItem(name: "idfv", value: vendorID),
        ]
        return components?.url
    }

    func pixel() -> URL? {
        let id = UIDevice.current.identifierForVendor!.uuidString
        return URL(string: "https://px.example.net/p.gif?d=\(id)")
    }

    func register() throws -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/devices")!)
        let install = UIDevice.current.identifierForVendor?.uuidString ?? ""
        let body = ["device": install]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.addValue(
            install,
            forHTTPHeaderField: "X-Install"
        )
        return request
    }
}
