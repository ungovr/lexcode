// lexcode-expect: 5
import Combine
import Foundation

final class Pixel {
    private let defaults = UserDefaults.standard

    var installID: String {
        if let id = defaults.string(forKey: "app_install_id") { return id }
        let id = UUID().uuidString
        defaults.set(id, forKey: "app_install_id")
        return id
    }

    func named() async throws {
        var components = URLComponents(string: "https://px.example.net/p")!
        components.queryItems = [
            URLQueryItem(name: "install_id", value: defaults.string(forKey: "iid")),
            URLQueryItem(name: "page", value: "1"),
        ]
        _ = try await URLSession.shared.data(from: components.url!)
    }

    func byValue() async throws {
        var components = URLComponents(string: "https://px.example.net/p")!
        components.queryItems = [Foundation.URLQueryItem(name: "src", value: self.installID)]
        let request = URLRequest(url: components.url!)
        _ = try await URLSession.shared.data(for: request)
    }

    func appended() {
        var components = URLComponents(string: "https://api.example.com/v1/hello")!
        components.queryItems?.append(URLQueryItem(name: "appInstallId", value: "x"))
        URLSession.shared.dataTask(with: components.url!) { _, _, _ in }.resume()
    }

    func uuidValue(installUUID: UUID) -> URLRequest {
        var components = URLComponents(string: "https://api.example.com/v1/ping")!
        components.queryItems = [URLQueryItem(name: "i", value: installUUID.uuidString)]
        return URLRequest(url: components.url!)
    }

    func published() -> AnyPublisher<Data, URLError> {
        var components = URLComponents(string: "https://px.example.net/p")!
        components.queryItems = [URLQueryItem(name: "install_id", value: installID)]
        return URLSession.shared.dataTaskPublisher(for: components.url!)
            .map(\.data)
            .eraseToAnyPublisher()
    }
}
