// lexcode-expect: 0
import Foundation

/// The app's own scriptable view with method names like WKWebView's. This file does not import
/// WebKit.
final class ScriptView {
    func load(_ request: URLRequest) {
        print(request)
    }

    func evaluateJavaScript(_ script: String) async throws -> Any? {
        script
    }
}

final class ReportRenderer {
    let view = ScriptView()

    func render(url: URL) async throws -> Any? {
        view.load(URLRequest(url: url))
        return try await view.evaluateJavaScript("document.documentElement.outerHTML")
    }
}
