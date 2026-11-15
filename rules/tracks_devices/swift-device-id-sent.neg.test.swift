// lexcode-expect: 0
import UIKit

// The identifier for vendor kept on the device: a key for the app's own local storage. It
// never leaves the phone.
final class LocalStore {
    func cacheKey() -> String {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? "local"
        UserDefaults.standard.set(Date(), forKey: "firstSeen-\(id)")
        return "cache-\(id)"
    }

    func cacheFile() -> URL {
        let id = UIDevice.current.identifierForVendor?.uuidString ?? "local"
        return FileManager.default.temporaryDirectory.appendingPathComponent(id)
    }

    // A request that carries the app's version, not the device's identity.
    func versionRequest() -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/config")!)
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        request.setValue(version, forHTTPHeaderField: "X-App-Version")
        return request
    }
}
