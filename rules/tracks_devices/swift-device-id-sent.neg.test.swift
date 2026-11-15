// lexcode-expect: 0
import UIKit

// The identifier for vendor kept on the device: a key for the app's own local storage, a file
// name, and an app-scheme deep link with the identifier in a query item, opened on the phone.
// None of it leaves the device.
final class LocalStore {
    func cacheKey() -> String {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? "local"
        UserDefaults.standard.set(Date(), forKey: "firstSeen-\(id)")
        return "cache-\(id)"
    }

    func cacheFile() throws -> Data {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? "local"
        let url = URL(string: "file:///tmp/\(id)")!
        _ = FileManager.default.temporaryDirectory.appendingPathComponent(id)
        return try Data(contentsOf: url)
    }

    func openSettings() {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? ""
        var components = URLComponents()
        components.scheme = "myapp"
        components.host = "settings"
        components.queryItems = [URLQueryItem(name: "device", value: id)]
        UIApplication.shared.open(components.url!)
    }

    // A request that carries the app's version, not the device's identity.
    func versionRequest() async throws {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/config")!)
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        request.setValue(version, forHTTPHeaderField: "X-App-Version")
        _ = try await URLSession.shared.data(for: request)
    }
}
