// lexcode-expect: 0
import UIKit
import WebKit

/// A rich-text editor in a web view that shows the app's own page. It reads its own markup back,
/// but it never loads a request from the web.
final class EditorViewController: UIViewController, WKNavigationDelegate {
    let webView = WKWebView()

    override func viewDidLoad() {
        super.viewDidLoad()
        let page = Bundle.main.url(forResource: "editor", withExtension: "html")!
        webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        webView.navigationDelegate = self
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.body.innerHTML") { html, _ in
            print(html as Any)
        }
    }

    func save() async throws -> String? {
        try await webView.evaluateJavaScript("document.getElementById('editor').innerHTML") as? String
    }
}
