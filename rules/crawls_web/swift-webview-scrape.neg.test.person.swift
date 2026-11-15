// lexcode-expect: 0
import UIKit
import WebKit

/// Web views a person drives one page at a time: an in-app browser with a reader mode that reads
/// the page the person opened, a sign-in page that reads the identity provider's confirmation
/// code, and a page the app writes into. None of these crawls the web.
final class ReaderBrowserViewController: UIViewController, WKNavigationDelegate {
    let webView = WKWebView()
    var readerMode = false

    func go(_ text: String) {
        guard let url = URL(string: text) else { return }
        webView.load(URLRequest(url: url))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard readerMode else { return }
        webView.evaluateJavaScript("document.body.innerText") { text, _ in
            self.showReader(text as? String)
        }
    }

    @MainActor
    func readNow() async throws -> String? {
        try await webView.evaluateJavaScript("document.documentElement.outerHTML") as? String
    }

    func showReader(_ text: String?) {
        print(text as Any)
    }
}

final class SignInViewController: UIViewController, WKNavigationDelegate {
    let webView = WKWebView()

    func start(_ authorizeURL: URL) {
        webView.navigationDelegate = self
        webView.load(URLRequest(url: authorizeURL))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.body.innerText") { text, _ in
            if let text = text as? String, text.contains("code=") {
                self.finish(text)
            }
        }
    }

    func finish(_ text: String) {
        print(text)
    }
}

final class OfflinePageViewController: UIViewController, WKNavigationDelegate {
    let webView = WKWebView()
    var history: [URL] = []

    func back() {
        guard !history.isEmpty else { return }
        webView.load(URLRequest(url: history.removeLast()))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.body.innerHTML = '<p>Offline</p>'")
        webView.evaluateJavaScript("document.body.innerText = ''")
    }
}
