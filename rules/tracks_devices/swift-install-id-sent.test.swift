// lexcode-expect: 11
import Foundation

final class APIClient {
    private let defaults = UserDefaults.standard

    // The install ID, made once and kept in the app's own defaults.
    var installID: String {
        if let id = defaults.string(forKey: "app_install_id") { return id }
        let id = UUID().uuidString
        defaults.set(id, forKey: "app_install_id")
        return id
    }

    var installUUID: UUID { UUID() }

    func common(_ request: inout URLRequest, utility: () -> String?) {
        // Wikipedia for iOS's two sends: by the value's name here, by the header's in `events`.
        if let appInstallID = utility() {
            request.setValue(appInstallID, forHTTPHeaderField: "X-WMF-UUID")
        }
        request.setValue(installID, forHTTPHeaderField: "X-App-Install-Id")
        request.addValue(
            defaults.string(forKey: "device") ?? "",
            forHTTPHeaderField: "X-Device-ID"
        )
    }

    func events(token: String) -> URLRequest {
        var request = URLRequest(url: URL(string: "https://events.example.org/v1/events")!)
        request.setValue(self.installID, forHTTPHeaderField: "X-Client")
        request.setValue(token, forHTTPHeaderField: "X-Acme-Device-UUID")
        request.setValue(installUUID.uuidString, forHTTPHeaderField: "X-Foo")
        request.setValue(token, forHTTPHeaderField: "X-App-Instance-Id")
        request.setValue(token, forHTTPHeaderField: "X-User-Device-Id")
        request.setValue(token, forHTTPHeaderField: "X-ACME-UUID")
        return request
    }
}

private extension URLRequest {
    mutating func populateCommonHeaders(installID: () -> String?) {
        if let appInstallID = installID() {
            setValue(appInstallID, forHTTPHeaderField: "X-Analytics-Id")
        }
        addValue(UUID().uuidString, forHTTPHeaderField: "X-Install-Id")
    }
}
