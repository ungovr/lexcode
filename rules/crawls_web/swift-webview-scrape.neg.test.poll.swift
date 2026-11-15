// lexcode-expect: 0
import UIKit
import WebKit

/// A reader view for the one article a person pasted: load it, wait for it to render, and read the
/// text. The loop polls one page; nothing is loaded from the loop's element.
final class ReaderSnapshot: NSObject, WKNavigationDelegate {
    let webView = WKWebView()

    @MainActor
    func snapshot(of url: URL) async throws -> String {
        webView.load(URLRequest(url: url))
        for _ in 0..<20 {
            try await Task.sleep(nanoseconds: 250_000_000)
            if let text = try await webView.evaluateJavaScript("document.body.innerText") as? String, !text.isEmpty {
                return text
            }
        }
        return ""
    }

    // Retries of the same page: the loop counts attempts, the address stays the one the person gave.
    @MainActor
    func retry(_ url: URL, attempts: [Int]) async throws -> String? {
        for attempt in attempts {
            print(attempt)
            webView.load(URLRequest(url: url))
            try await Task.sleep(nanoseconds: 500_000_000)
            let html = try await webView.evaluateJavaScript("document.documentElement.outerHTML") as? String
            if html != nil {
                return html
            }
        }
        return nil
    }
}
