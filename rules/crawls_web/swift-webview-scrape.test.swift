// lexcode-expect: 4
import UIKit
import WebKit

/// A headless web view that loads other sites' pages and pulls their content out.
final class HeadlessScraper: NSObject, WKNavigationDelegate {
    private let webView = WKWebView(frame: .zero)
    private var pending: [URL] = []

    func start(with urls: [URL]) {
        pending = urls
        webView.navigationDelegate = self
        loadNext()
    }

    private func loadNext() {
        guard !pending.isEmpty else { return }
        webView.load(URLRequest(url: pending.removeFirst()))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.documentElement.outerHTML") { [weak self] html, _ in
            print(html as? String ?? "")
            self?.loadNext()
        }
    }

    @MainActor
    func scrape(url: URL) async throws -> String? {
        webView.load(URLRequest(url: url))
        try await Task.sleep(nanoseconds: 2_000_000_000)
        return try await webView.evaluateJavaScript("document.body.innerText") as? String
    }

    @MainActor
    func links(url: URL) async throws -> Any? {
        let request = URLRequest(url: url)
        webView.load(request)
        return try await webView.callAsyncJavaScript(
            "return Array.from(document.querySelectorAll('a')).map(a => a.href)",
            contentWorld: .page
        )
    }

    @MainActor
    func serialized(url: URL) async throws -> Any? {
        webView.load(URLRequest(url: url))
        return try await webView.evaluateJavaScript("new XMLSerializer().serializeToString(document)")
    }
}
