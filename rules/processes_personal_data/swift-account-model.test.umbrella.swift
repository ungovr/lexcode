// lexcode-expect: 1
import UIKit
import Firebase

// Firebase Authentication reached through the Firebase umbrella module.
final class UmbrellaAccounts {
    func signIn(email: String, password: String) async throws {
        _ = try await Auth.auth().signIn(withEmail: email, password: password)
    }
}
