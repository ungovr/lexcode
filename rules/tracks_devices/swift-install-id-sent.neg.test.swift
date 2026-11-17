// lexcode-expect: 0
import Foundation

// Values that change with each request or visit, a person's account ID, an ID kept only on the
// device, the vendor's hardware device named in a query, and a header or query item whose name and
// value say nothing of an install.
final class RequestDecorator {
    let installID = UUID().uuidString

    func decorate(_ request: inout URLRequest, session: String, lock: String) {
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-UUID")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Correlation-ID")
        request.setValue(session, forHTTPHeaderField: "X-Session-UUID")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Idempotency-UUID")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Trace-Device-Id")
        request.setValue(session, forHTTPHeaderField: "X-User-UUID")
        request.setValue(lock, forHTTPHeaderField: "X-Account-Uuid")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(lock, forHTTPHeaderField: "Lock-Device")
        UserDefaults.standard.set(installID, forKey: "install_id")
        print("install \(installID)")
    }

    func lockURL(lockID: String) -> URL? {
        var components = URLComponents(string: "https://locks.example.com/v1/unlock")!
        components.queryItems = [
            URLQueryItem(name: "device_id", value: lockID),
            URLQueryItem(name: "page", value: "1"),
        ]
        return components.url
    }
}

private extension URLRequest {
    mutating func trace() {
        setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-Id")
        addValue("gzip", forHTTPHeaderField: "Accept-Encoding")
    }
}
