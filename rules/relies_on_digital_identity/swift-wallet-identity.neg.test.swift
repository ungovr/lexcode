// lexcode-expect: 0
import UIKit
import PassKit
import ProximityReader
import AuthenticationServices
import LocalAuthentication

// The nearest lookalikes. Checking whether Verify with Wallet or Tap to Present ID is available
// asks for nothing. Sign in with Apple and a passkey sign a person in to an account the app
// already holds, which the definition leaves out with password and social sign-in. Face ID
// through LocalAuthentication unlocks the device's own credential and tells the app only yes or
// no. Apple Pay takes a payment, not an identity.
final class AccountViewController: UIViewController, ASAuthorizationControllerDelegate {
    func canVerify() async -> Bool {
        let controller = PKIdentityAuthorizationController()
        let descriptor = PKIdentityDriversLicenseDescriptor()
        let wallet = await controller.canRequestDocument(descriptor)
        return wallet && MobileDocumentReader.isSupported
    }

    func signInWithApple() {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.performRequests()
    }

    func passkey(challenge: Data) {
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: "example.org")
        let request = provider.createCredentialAssertionRequest(challenge: challenge)
        ASAuthorizationController(authorizationRequests: [request]).performRequests()
    }

    func unlock() async throws -> Bool {
        try await LAContext().evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Unlock your notes")
    }

    func pay(request: PKPaymentRequest) {
        PKPaymentAuthorizationController(paymentRequest: request).present()
    }
}
