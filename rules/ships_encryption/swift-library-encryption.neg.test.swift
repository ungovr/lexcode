// lexcode-expect: 0
import Foundation
import CryptoKit
import CommonCrypto
import Security

// The platform's own cryptography: CryptoKit, CommonCrypto and the Security framework ship with
// iOS and macOS, so encrypting with them is calling the platform's cryptography APIs, which the
// definition leaves out.
final class LocalVault {
    func seal(_ data: Data, key: SymmetricKey) throws -> Data? {
        let box = try AES.GCM.seal(data, using: key)
        return box.combined
    }

    func sealAwaited(_ data: Data, key: SymmetricKey) async throws -> Data {
        try await ChaChaPoly.seal(data, using: key).combined
    }

    func open(_ combined: Data, key: SymmetricKey) throws -> Data {
        try AES.GCM.open(AES.GCM.SealedBox(combined: combined), using: key)
    }

    func agree(peer: Curve25519.KeyAgreement.PublicKey) throws -> SharedSecret {
        let mine = Curve25519.KeyAgreement.PrivateKey()
        return try mine.sharedSecretFromKeyAgreement(with: peer)
    }

    func commonCrypto(key: [UInt8], iv: [UInt8], input: [UInt8]) -> [UInt8] {
        var out = [UInt8](repeating: 0, count: input.count + kCCBlockSizeAES128)
        var moved = 0
        _ = CCCrypt(CCOperation(kCCEncrypt), CCAlgorithm(kCCAlgorithmAES), CCOptions(kCCOptionPKCS7Padding),
                    key, key.count, iv, input, input.count, &out, out.count, &moved)
        return Array(out.prefix(moved))
    }

    func rsa(publicKey: SecKey, data: Data) -> Data? {
        SecKeyCreateEncryptedData(publicKey, .rsaEncryptionOAEPSHA256, data as CFData, nil) as Data?
    }

    // Calling HTTPS through the platform's stock client.
    func fetch(url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}
