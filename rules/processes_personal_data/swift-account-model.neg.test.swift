// lexcode-expect: 0
import Foundation

// The app's own types with the libraries' names, in a file that imports none of Fluent,
// FirebaseAuth or AuthenticationServices: a local unlock screen and a test double.
protocol ModelAuthenticatable {}

final class Vault: ModelAuthenticatable {}

extension Vault {
    func unlock() {}
}

final class Auth {
    static func auth() -> Auth { Auth() }
    func signIn(withEmail email: String, password: String) {}
    func createUser(withEmail email: String, password: String) {}
}

struct LocalRequest {
    var requestedScopes: [String] = []
}

final class Unlock {
    func run() {
        Auth.auth().signIn(withEmail: "demo@example.org", password: "x")
        Auth.auth().createUser(withEmail: "demo@example.org", password: "x")
        var request = LocalRequest()
        request.requestedScopes = ["email"]
    }
}
