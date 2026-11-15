// lexcode-expect: 0
import UIKit
import Vapor

// The nearest lookalikes: accepting terms of service with a button (contract formation, which
// the definition leaves out), an e-signature vendor's marketing and help pages, and its account
// API (no envelope, request or agreement).
final class TermsViewController: UIViewController {
    var accepted = false

    @objc func acceptTapped() {
        accepted = true
        UserDefaults.standard.set(Date(), forKey: "termsAcceptedAt")
    }

    let pricing = URL(string: "https://www.docusign.com/products/electronic-signature")
    let help = URL(string: "https://support.docusign.com/s/document-item?language=en_US")
    let userInfo = URL(string: "https://account-d.docusign.com/oauth/userinfo")
    let adobe = URL(string: "https://www.adobe.com/acrobat/business/sign.html")
}

struct AccountController {
    func me(_ req: Request) async throws -> ClientResponse {
        try await req.client.get("https://api.hellosign.com/v3/account")
    }
}
