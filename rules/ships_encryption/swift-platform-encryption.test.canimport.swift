// lexcode-expect: 1
import Foundation
import CommonCrypto
#if canImport(CryptoKit)
import CryptoKit
#else
import Crypto
#endif

// A package that builds on Linux with swift-crypto as well: its CryptoKit-shaped calls are
// swift-library-encryption's, so this rule reads only the CommonCrypto cipher.
struct PortableVault {
    let key: SymmetricKey

    func seal(_ data: Data) throws -> Data? {
        try AES.GCM.seal(data, using: key).combined
    }

    func agree(mine: Curve25519.KeyAgreement.PrivateKey, peer: Curve25519.KeyAgreement.PublicKey) throws -> SharedSecret {
        try mine.sharedSecretFromKeyAgreement(with: peer)
    }

    func legacy(key: [UInt8], input: [UInt8]) -> [UInt8] {
        var out = [UInt8](repeating: 0, count: input.count + kCCBlockSizeAES128)
        var moved = 0
        _ = CCCrypt(CCOperation(kCCDecrypt), CCAlgorithm(kCCAlgorithmAES), CCOptions(kCCOptionPKCS7Padding),
                    key, key.count, nil, input, input.count, &out, out.count, &moved)
        return Array(out.prefix(moved))
    }
}
