// lexcode-expect: 0
import UIKit

// A query item that holds the install ID in a URL the app never requests (an app-scheme deep link
// opened on the phone, a URL only built and returned), a hardware device named in a query, and a
// GitHub App's installation ID.
final class Links {
    let installID = UUID().uuidString

    func openSetup() {
        var components = URLComponents(string: "myapp://setup")!
        components.queryItems = [URLQueryItem(name: "install_id", value: installID)]
        UIApplication.shared.open(components.url!)
    }

    func built() -> URL? {
        var components = URLComponents(string: "https://px.example.net/p")!
        components.queryItems = [URLQueryItem(name: "src", value: installID)]
        return components.url
    }

    func unlock(lockID: String) async throws {
        var components = URLComponents(string: "https://locks.example.com/v1/unlock")!
        components.queryItems = [URLQueryItem(name: "device_id", value: lockID)]
        _ = try await URLSession.shared.data(from: components.url!)
    }

    func unlockPublisher(lockID: String) -> URLSession.DataTaskPublisher {
        var components = URLComponents(string: "https://locks.example.com/v1/unlock")!
        components.queryItems = [URLQueryItem(name: "device_id", value: lockID)]
        return URLSession.shared.dataTaskPublisher(for: components.url!)
    }

    func githubToken(githubInstallationID: Int, installationID: String) async throws {
        var components = URLComponents(string: "https://api.github.com/app/installations")!
        components.queryItems = [
            URLQueryItem(name: "installation_id", value: "\(githubInstallationID)"),
            URLQueryItem(name: "id", value: installationID),
        ]
        _ = try await URLSession.shared.data(from: components.url!)
    }
}
