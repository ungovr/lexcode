// lexcode-expect: 0
import UIKit
import WebKit

/// An in-app browser a person drives one page at a time. It reads the page title and its height,
/// not the page's content, and its one full read is of the app's own development server.
final class BrowserViewController: UIViewController, WKNavigationDelegate {
    let webView = WKWebView()

    func open(_ url: URL) {
        webView.load(URLRequest(url: url))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.title") { [weak self] title, _ in
            self?.title = title as? String
        }
        webView.evaluateJavaScript("document.documentElement.scrollHeight") { height, _ in
            print(height as Any)
        }
    }

    @MainActor
    func localPreview() async throws {
        webView.load(URLRequest(url: URL(string: "http://localhost:3000/preview")!))
        _ = try await webView.evaluateJavaScript("document.documentElement.outerHTML")
    }
}
