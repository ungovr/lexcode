// lexcode-expect: 4
import UIKit
import WebKit

/// A headless web view that loads a list of other sites' pages, one after another, and pulls
/// each page's content out. No person picks the pages.
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
    func scrapeAll(urls: [URL]) async throws -> [String] {
        var pages: [String] = []
        for url in urls {
            webView.load(URLRequest(url: url))
            try await Task.sleep(nanoseconds: 2_000_000_000)
            let text = try await webView.evaluateJavaScript("document.body.innerText") as? String
            pages.append(text ?? "")
        }
        return pages
    }

    @MainActor
    func links(urls: [URL]) async throws {
        for url in urls {
            let request = URLRequest(url: url)
            webView.load(request)
            let found = try await webView.callAsyncJavaScript(
                "return Array.from(document.querySelectorAll('a')).map(a => a.href)",
                contentWorld: .page
            )
            print(found as Any)
        }
    }

    @MainActor
    func serialized(urls: [URL]) async throws {
        for url in urls {
            webView.load(URLRequest(url: url))
            print(try await webView.evaluateJavaScript("new XMLSerializer().serializeToString(document)") as Any)
        }
    }
}
