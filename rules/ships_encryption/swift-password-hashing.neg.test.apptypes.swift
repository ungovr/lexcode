// lexcode-expect: 0
import Foundation

// The app's own Bcrypt and password helper, in a file without Vapor, Hummingbird, Argon2Swift or
// CryptoSwift: a test double that "hashes" by reversing the string.
enum Bcrypt {
    static func hash(_ password: String, cost: Int = 12) -> String { String(password.reversed()) }
}

struct PasswordBox {
    func hash(_ password: String) -> String { Bcrypt.hash(password) }
}

struct Request {
    let password = PasswordBox()
}

struct FakeSignup {
    func run(req: Request, password: String) async throws -> String {
        let a = Bcrypt.hash(password)
        let b = req.password.hash(password)
        return a + b
    }
}
