// lexcode-expect: 0
import Foundation
import Crypto

// swift-crypto used for what hides nothing: a key derived and a key made but never used to encrypt,
// a digest, random bytes, and HTTPS through the platform's stock client.
final class Keys {
    func derive(_ secret: SymmetricKey) -> SymmetricKey {
        HKDF<SHA256>.deriveKey(inputKeyMaterial: secret, salt: Data(), info: Data(), outputByteCount: 32)
    }

    func freshKey() -> SymmetricKey {
        SymmetricKey(size: .bits256)
    }

    func fingerprint(_ data: Data) -> String {
        SHA512.hash(data: data).description
    }

    func fetch(url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}
