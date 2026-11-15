// lexcode-expect: 0
import Foundation
import Vapor
import CryptoKit

// The nearest lookalikes: checking a password against a stored hash (verify, not hash), and the
// platform's own digest and key derivation, which are not read for any language.
struct LoginController {
    func login(req: Request, password: String, stored: String) async throws -> Bool {
        let a = try Bcrypt.verify(password, created: stored)
        let b = try await req.password.async.verify(password, created: stored)
        return a && b
    }

    func fingerprint(_ data: Data) -> String {
        SHA256.hash(data: data).description
    }

    func derive(secret: SymmetricKey, salt: Data) -> SymmetricKey {
        HKDF<SHA256>.deriveKey(inputKeyMaterial: secret, salt: salt, outputByteCount: 32)
    }
}
