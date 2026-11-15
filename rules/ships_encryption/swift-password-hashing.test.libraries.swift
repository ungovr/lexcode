// lexcode-expect: 4
import Foundation
import HummingbirdBcrypt
import Argon2Swift
import CryptoSwift

// Hummingbird's bcrypt, Argon2 and CryptoSwift's password-based key derivation.
struct PasswordService {
    func hash(_ password: String) async throws -> [String] {
        let bcrypt = try await Bcrypt.hash(password, cost: 12)
        let argon = try Argon2Swift.hashPasswordString(password: password, salt: Salt.newSalt())
        let pbkdf2 = try PKCS5.PBKDF2(password: Array(password.utf8), salt: Array("salt".utf8), iterations: 4096, keyLength: 32, variant: .sha2(.sha256)).calculate()
        let scrypt = try await Scrypt(password: Array(password.utf8), salt: Array("salt".utf8), dkLen: 64, N: 16384, r: 8, p: 1).calculate()
        return [bcrypt, argon.encodedString(), pbkdf2.toHexString(), scrypt.toHexString()]
    }
}
