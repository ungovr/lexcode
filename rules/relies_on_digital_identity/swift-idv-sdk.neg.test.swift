// lexcode-expect: 0
import UIKit
import AppAuth
import GoogleSignIn
import StripePaymentSheet
import CoreNFC

// The nearest lookalikes. An OpenID Connect or Google sign-in links an account and is left out
// by the definition. Stripe's payment sheet is the same vendor's SDK for a payment, not an
// identity. Reading an NFC tag is not reading a passport chip.
final class SignInViewController: UIViewController, NFCNDEFReaderSessionDelegate {
    var authState: OIDAuthState?
    var flow: OIDExternalUserAgentSession?

    func openID(configuration: OIDServiceConfiguration) {
        let request = OIDAuthorizationRequest(
            configuration: configuration,
            clientId: "client",
            scopes: [OIDScopeOpenID, OIDScopeProfile],
            redirectURL: URL(string: "org.example:/callback")!,
            responseType: OIDResponseTypeCode,
            additionalParameters: nil
        )
        flow = OIDAuthState.authState(byPresenting: request, presenting: self) { state, _ in
            self.authState = state
        }
    }

    func google() async throws {
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: self)
        print(result.user.profile?.email ?? "")
    }

    func pay(secret: String) {
        let sheet = PaymentSheet(paymentIntentClientSecret: secret, configuration: PaymentSheet.Configuration())
        sheet.present(from: self) { _ in }
    }

    func readTag() {
        let session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: true)
        session.begin()
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {}
    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {}
}
