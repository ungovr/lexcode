// lexcode-expect: 15
import Foundation
import CryptoSwift
import Sodium
import LibSignalClient
import ObjectivePGP
import JOSESwift
import OpenSSL

// Encryption from libraries the app bundles: CryptoSwift, libsodium (swift-sodium), the Signal
// protocol, OpenPGP, JOSE encryption (a JWE) and OpenSSL.
final class SecureNotes {
    let sodium = Sodium()

    func cryptoSwift(key: [UInt8], iv: [UInt8], plain: [UInt8]) async throws -> [UInt8] {
        let aes = try AES(key: key, blockMode: GCM(iv: iv, mode: .combined), padding: .noPadding)
        let first = try aes.encrypt(plain)
        let second = try await AES(key: key, blockMode: CBC(iv: iv), padding: .pkcs7).encrypt(first)
        let third = try ChaCha20(key: key, iv: iv).encrypt(second)
        let sealed = try AEADChaCha20Poly1305.encrypt(third, key: key, iv: iv, authenticationHeader: [])
        let blow = try CryptoSwift.Blowfish(
            key: key,
            blockMode: CBC(iv: iv),
            padding: .pkcs7
        )
        _ = blow
        return sealed.cipherText
    }

    func libsodium(secretKey: Bytes, peer: Bytes, mine: Bytes, message: Bytes) async throws -> Bytes? {
        let a: Bytes? = sodium.secretBox.seal(message: message, secretKey: secretKey)
        let b: Bytes? = sodium.box.seal(message: message, recipientPublicKey: peer, senderSecretKey: mine)
        let c: Bytes? = sodium.aead.xchacha20poly1305ietf.encrypt(message: message, secretKey: secretKey)
        let stream = sodium.secretStream.xchacha20poly1305.initPush(secretKey: secretKey)
        let opened = try await sodium.secretBox.open(nonceAndAuthenticatedCipherText: a ?? [], secretKey: secretKey)
        _ = (b, c, stream)
        return opened
    }

    func signal(message: Data, to address: ProtocolAddress, store: InMemorySignalProtocolStore) throws -> CiphertextMessage {
        try signalEncrypt(message: message, for: address, sessionStore: store, identityStore: store, context: NullContext())
    }

    func pgp(data: Data, keys: [Key]) async throws -> Data {
        try await ObjectivePGP.encrypt(data, addSignature: false, using: keys)
    }

    func jwe(payload: Data, publicKey: SecKey) throws -> String {
        let header = JWEHeader(keyManagementAlgorithm: .RSAOAEP256, contentEncryptionAlgorithm: .A256CBCHS512)
        let encrypter = Encrypter(keyManagementAlgorithm: .RSAOAEP256, contentEncryptionAlgorithm: .A256CBCHS512, encryptionKey: publicKey)!
        let jwe = try JWE(header: header, payload: Payload(payload), encrypter: encrypter)
        return jwe.compactSerializedString
    }

    func jweDecrypt(serialized: String, privateKey: SecKey) throws -> Data {
        let jwe = try JWE(compactSerialization: serialized)
        let decrypter = Decrypter(keyManagementAlgorithm: .RSAOAEP256, contentEncryptionAlgorithm: .A256CBCHS512, decryptionKey: privateKey)!
        return try jwe.decrypt(using: decrypter).data()
    }

    func openssl(key: [UInt8], iv: [UInt8]) {
        let ctx = EVP_CIPHER_CTX_new()
        EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nil, key, iv)
        EVP_CIPHER_CTX_free(ctx)
    }
}
