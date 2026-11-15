// lexcode-expect: 0
import Foundation
import Crypto
import JWTKit

// swift-crypto used for what is not encryption: a webhook's HMAC, a digest, and signing a JWT
// with an RSA or Ed25519 key. A signature or a MAC proves who sent a message; it hides nothing.
struct WebhookVerifier {
    func verify(body: Data, header: String, secret: String) -> Bool {
        let key = SymmetricKey(data: Data(secret.utf8))
        var hmac = HMAC<SHA256>.init(key: key)
        hmac.update(data: body)
        let mac = hmac.finalize()
        let digest = SHA256.hash(data: body)
        return header == "sha256=\(Data(mac).base64EncodedString())" && !digest.description.isEmpty
    }

    func signToken(pem: String, payload: some JWTPayload) async throws -> String {
        let keys = JWTKeyCollection()
        await keys.add(rsa: try Insecure.RSA.PrivateKey(pem: pem), digestAlgorithm: .sha256)
        return try await keys.sign(payload)
    }

    func signEd25519(_ data: Data) throws -> Data {
        let key = Curve25519.Signing.PrivateKey()
        return try key.signature(for: data)
    }
}
