// lexcode-expect: 8
import UIKit

final class DeviceReporter {
    func headerRequest() -> URLRequest {
        let deviceID = UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/sessions")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        return request
    }

    func attribution() async throws {
        let vendorID = UIDevice.current.identifierForVendor?.uuidString ?? ""
        var components = URLComponents(string: "https://ads.example.net/attribution")!
        components.queryItems = [
            URLQueryItem(name: "idfv", value: vendorID),
        ]
        let request = URLRequest(url: components.url!)
        _ = try await URLSession.shared.data(for: request)
    }

    func pixel() async throws {
        let id = UIDevice.current.identifierForVendor!.uuidString
        let url = URL(string: "https://px.example.net/p.gif?d=\(id)")!
        _ = try await URLSession.shared.data(from: url)
    }

    func pixelOrNothing() async {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? ""
        let url = URL(string: "https://px.example.net/p.gif?d=\(id)")!
        _ = try? await URLSession.shared.data(from: url)
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

    func qualified() {
        let id = UIKit.UIDevice.current.identifierForVendor?.uuidString ?? ""
        var request = Foundation.URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        request.setValue(id, forHTTPHeaderField: "X-Device-Id")
        print(request)
    }

    func legacyTask() {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? ""
        var components = URLComponents(string: "https://api.example.com/v1/hello")!
        components.queryItems?.append(URLQueryItem(name: "d", value: id))
        URLSession.shared.dataTask(with: components.url!) { _, _, _ in }.resume()
    }
}
