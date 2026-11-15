// lexcode-expect: 0
import UIKit
import WebKit

/// Pages the app writes into: each cached offline page is loaded in turn and its body is
/// replaced. The scripts write the page; nothing is read back.
final class OfflineRenderer: NSObject, WKNavigationDelegate {
    let webView = WKWebView()

    @MainActor
    func warm(cachedPages: [URL]) async throws {
        for url in cachedPages {
            webView.load(URLRequest(url: url))
            _ = try await webView.evaluateJavaScript("document.body.innerHTML = ''")
            _ = try await webView.evaluateJavaScript("document.body.innerText += ' (offline)'")
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.documentElement.innerHTML = '<p>Offline</p>'")
    }
}
