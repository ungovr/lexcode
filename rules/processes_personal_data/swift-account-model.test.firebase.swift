// lexcode-expect: 6
import SwiftUI
import FirebaseAuth
import AuthenticationServices

final class AccountService {
    func register(email: String, password: String) async throws {
        let result = try await Auth.auth().createUser(withEmail: email, password: password)
        print(result.user.uid)
    }

    func signIn(email: String, password: String) {
        Auth.auth().signIn(withEmail: email, password: password) { result, error in
            print(result as Any, error as Any)
        }
    }

    func magicLink(email: String, settings: ActionCodeSettings) async throws {
        try await Auth
            .auth()
            .sendSignInLink(toEmail: email, actionCodeSettings: settings)
    }

    func appleRequest() -> ASAuthorizationAppleIDRequest {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        return request
    }

    func emailOnly(_ request: ASAuthorizationAppleIDRequest) {
        request.requestedScopes = [ASAuthorization.Scope.email]
    }
}

struct SignInView: View {
    var body: some View {
        SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.email]
        } onCompletion: { result in
            print(result)
        }
    }
}
