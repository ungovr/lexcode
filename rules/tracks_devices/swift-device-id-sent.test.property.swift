// lexcode-expect: 3
import UIKit

// The identifier kept in a stored property and sent from a method of the same type.
final class Reporter {
    let deviceID = UIDevice.current.identifierForVendor?.uuidString ?? ""
    private lazy var vendorID: String = UIDevice.current.identifierForVendor!.uuidString

    func send() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        request.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        request.setValue(self.vendorID, forHTTPHeaderField: "X-Vendor")
        return request
    }
}

struct Ping {
    var id: String = UIDevice.current.identifierForVendor?.uuidString ?? ""

    func pixel() async throws {
        _ = try await URLSession.shared.data(from: URL(string: "https://px.example.net/p.gif?d=\(id)")!)
    }
}
