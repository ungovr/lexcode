// lexcode-expect: 0
import UIKit
import FirebaseAuth
import AuthenticationServices

// With the real frameworks imported: an anonymous Firebase session and a Sign in with Apple
// request that asks for no name and no email (the app gets only an opaque id), and signing out.
final class GuestSession {
    func start() async throws {
        let result = try await Auth.auth().signInAnonymously()
        print(result.user.isAnonymous)
    }

    func appleRequest() -> ASAuthorizationAppleIDRequest {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = []
        return request
    }

    func end() throws {
        try Auth.auth().signOut()
    }
}
