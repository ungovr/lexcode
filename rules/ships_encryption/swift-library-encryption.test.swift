// lexcode-expect: 14
import Foundation
import Vapor
#if canImport(CryptoKit)
import CryptoKit
#else
import Crypto
#endif
import _CryptoExtras

// A Vapor service that encrypts with swift-crypto, the package that bundles BoringSSL on Linux.
struct TokenVault {
    let key: SymmetricKey

    func seal(_ data: Data) throws -> Data? {
        try AES.GCM.seal(data, using: key).combined
    }

    func sealAwaited(_ data: Data) async throws -> Data {
        try await ChaChaPoly.seal(data, using: key).combined
    }

    func sealQualified(_ data: Data) throws -> Data? {
        try? Crypto.AES.GCM.seal(data, using: key, nonce: AES.GCM.Nonce()).combined
    }

    func open(_ combined: Data) throws -> Data {
        let box = try AES.GCM.SealedBox(combined: combined)
        return try AES.GCM.open(box, using: key)
    }

    func openChaCha(_ combined: Data) throws -> Data {
        try ChaChaPoly.open(ChaChaPoly.SealedBox(combined: combined), using: key)
    }

    func wrap(_ other: SymmetricKey) throws -> Data {
        try AES.KeyWrap.wrap(other, using: key)
    }

    func agree(peer: Curve25519.KeyAgreement.PublicKey) async throws -> SharedSecret {
        let mine = Curve25519.KeyAgreement.PrivateKey()
        return try await mine.sharedSecretFromKeyAgreement(
            with: peer
        )
    }

    func hpke(recipient: Curve25519.KeyAgreement.PublicKey, message: Data) throws -> Data {
        var sender = try HPKE.Sender(recipientKey: recipient, ciphersuite: .Curve25519_SHA256_ChachaPoly, info: Data())
        return try sender.seal(message)
    }

    func rsa(der: Data, message: Data) throws -> Data {
        let publicKey = try _RSA.Encryption.PublicKey(derRepresentation: der)
        return try publicKey.encrypt(message, padding: .PKCS1_OAEP_SHA256)
    }

    func cbc(_ data: Data) async throws -> Data {
        let iv = try AES._CBC.IV(ivBytes: Array(repeating: 0, count: 16))
        let a = try AES._CBC.encrypt(data, using: key, iv: iv)
        let b = try await AES._CTR.encrypt(a, using: key, nonce: AES._CTR.Nonce())
        return b
    }

    // The receiving and decrypting siblings.
    func receive(mine: Curve25519.KeyAgreement.PrivateKey, encapsulated: Data, der: Data, sealed: Data) async throws -> Data {
        var recipient = try await HPKE.Recipient(privateKey: mine, ciphersuite: .Curve25519_SHA256_ChachaPoly, info: Data(), encapsulatedKey: encapsulated)
        let privateKey = try _RSA.Encryption.PrivateKey(derRepresentation: der)
        let plain = try AES._CBC.decrypt(sealed, using: key, iv: AES._CBC.IV(ivBytes: Array(repeating: 0, count: 16)))
        return try recipient.open(privateKey.decrypt(plain, padding: .PKCS1_OAEP_SHA256))
    }
}
