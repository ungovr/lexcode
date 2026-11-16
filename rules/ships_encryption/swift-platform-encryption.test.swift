// lexcode-expect: 16
import Foundation
import CryptoKit
import CommonCrypto
import Security

// An app that encrypts what it stores and agrees keys with a peer through Apple's own frameworks.
final class LocalVault {
    func seal(_ data: Data, key: SymmetricKey) throws -> Data? {
        let box = try AES.GCM.seal(data, using: key)
        return box.combined
    }

    func sealAwaited(_ data: Data, key: SymmetricKey) async throws -> Data {
        try await ChaChaPoly.seal(data, using: key).combined
    }

    func sealQualified(_ data: Data, key: SymmetricKey) throws -> Data? {
        try CryptoKit.AES.GCM.seal(data, using: key).combined
    }

    func open(_ combined: Data, key: SymmetricKey) throws -> Data {
        try AES.GCM.open(AES.GCM.SealedBox(combined: combined), using: key)
    }

    func openChaCha(_ combined: Data, key: SymmetricKey) throws -> Data {
        try ChaChaPoly.open(ChaChaPoly.SealedBox(combined: combined), using: key)
    }

    func wrap(_ other: SymmetricKey, key: SymmetricKey) throws -> Data {
        try AES.KeyWrap.wrap(other, using: key)
    }

    func unwrap(_ wrapped: Data, key: SymmetricKey) throws -> SymmetricKey {
        try AES.KeyWrap.unwrap(wrapped, using: key)
    }

    func agree(peer: Curve25519.KeyAgreement.PublicKey) throws -> SharedSecret {
        let mine = Curve25519.KeyAgreement.PrivateKey()
        return try mine.sharedSecretFromKeyAgreement(with: peer)
    }

    func agreeP256(peer: P256.KeyAgreement.PublicKey, mine: P256.KeyAgreement.PrivateKey) async throws -> SharedSecret {
        try await mine.sharedSecretFromKeyAgreement(
            with: peer
        )
    }

    func hpke(recipient: P256.KeyAgreement.PublicKey, message: Data) throws -> Data {
        var sender = try HPKE.Sender(recipientKey: recipient, ciphersuite: .P256_SHA256_AES_GCM_256, info: Data())
        return try sender.seal(message)
    }

    func commonCrypto(key: [UInt8], iv: [UInt8], input: [UInt8]) -> [UInt8] {
        var out = [UInt8](repeating: 0, count: input.count + kCCBlockSizeAES128)
        var moved = 0
        _ = CCCrypt(CCOperation(kCCEncrypt), CCAlgorithm(kCCAlgorithmAES), CCOptions(kCCOptionPKCS7Padding),
                    key, key.count, iv, input, input.count, &out, out.count, &moved)
        return Array(out.prefix(moved))
    }

    func cryptor(key: [UInt8]) -> CCCryptorRef? {
        var ref: CCCryptorRef?
        _ = CCCryptorCreateWithMode(CCOperation(kCCEncrypt), CCMode(kCCModeCTR), CCAlgorithm(kCCAlgorithmAES),
                                    CCPadding(ccNoPadding), nil, key, key.count, nil, 0, 0, CCModeOptions(kCCModeOptionCTR_BE), &ref)
        return ref
    }

    func rsa(publicKey: SecKey, data: Data) -> Data? {
        SecKeyCreateEncryptedData(publicKey, .rsaEncryptionOAEPSHA256, data as CFData, nil) as Data?
    }

    func rsaOpen(privateKey: SecKey, data: Data) -> Data? {
        SecKeyCreateDecryptedData(privateKey, .eciesEncryptionCofactorX963SHA256AESGCM, data as CFData, nil) as Data?
    }

    func exchange(privateKey: SecKey, peer: SecKey) -> Data? {
        SecKeyCopyKeyExchangeResult(privateKey, .ecdhKeyExchangeStandardX963SHA256, peer, [:] as CFDictionary, nil) as Data?
    }
}
