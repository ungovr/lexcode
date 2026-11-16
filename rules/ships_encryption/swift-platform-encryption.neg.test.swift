// lexcode-expect: 0
import Foundation
import CryptoKit
import CommonCrypto
import Security

// Apple's cryptography used for what is not confidentiality: hashing, MACs, key derivation,
// signing, random bytes, the Keychain, file protection, a key made and never used, and HTTPS.
final class Integrity {
    func digest(_ data: Data) -> String {
        let a = SHA256.hash(data: data)
        let b = Insecure.MD5.hash(data: data)
        return a.description + b.description
    }

    func mac(_ body: Data, secret: SymmetricKey) -> Data {
        Data(HMAC<SHA256>.authenticationCode(for: body, using: secret))
    }

    func derive(_ secret: SymmetricKey) -> SymmetricKey {
        HKDF<SHA256>.deriveKey(inputKeyMaterial: secret, salt: Data(), info: Data(), outputByteCount: 32)
    }

    func sign(_ data: Data) throws -> Data {
        let key = P256.Signing.PrivateKey()
        let ed = Curve25519.Signing.PrivateKey()
        _ = try ed.signature(for: data)
        return try key.signature(for: data).derRepresentation
    }

    func freshKey() -> SymmetricKey {
        SymmetricKey(size: .bits256)
    }

    func commonCryptoHash(_ bytes: [UInt8], key: [UInt8]) -> [UInt8] {
        var out = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        _ = CC_SHA256(bytes, CC_LONG(bytes.count), &out)
        var mac = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        CCHmac(CCHmacAlgorithm(kCCHmacAlgSHA256), key, key.count, bytes, bytes.count, &mac)
        return out + mac
    }

    func passwordKey(_ password: String, salt: [UInt8]) -> [UInt8] {
        var derived = [UInt8](repeating: 0, count: 32)
        _ = CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2), password, password.utf8.count, salt, salt.count,
                                 CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), 600_000, &derived, derived.count)
        return derived
    }

    func signWithSecKey(_ key: SecKey, data: Data) -> Data? {
        SecKeyCreateSignature(key, .ecdsaSignatureMessageX962SHA256, data as CFData, nil) as Data?
    }

    func random() -> [UInt8] {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return bytes
    }

    func remember(token: String) {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecValueData as String: Data(token.utf8)]
        SecItemAdd(query as CFDictionary, nil)
    }

    func store(_ data: Data, at url: URL) throws {
        try data.write(to: url, options: .completeFileProtection)
    }

    func fetch(url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}
