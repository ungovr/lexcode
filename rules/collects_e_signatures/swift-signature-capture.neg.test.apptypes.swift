// lexcode-expect: 0
import Foundation
import CryptoKit

// The app's own types with the signature pads' method names, in a file that names neither pad
// and does not import PencilKit: a release tool that signs a build manifest with a key.
final class ManifestSigner {
    let key = Curve25519.Signing.PrivateKey()
    var signature: Data?

    func getSignature(scale: Int) -> Data? { signature }
    func getCroppedSignature() -> Data? { signature?.prefix(32) }
}

struct ReleaseTool {
    let signer = ManifestSigner()

    func run(manifest: Data) async throws -> Data? {
        signer.signature = try signer.key.signature(for: manifest)
        _ = signer.getSignature(scale: 1)
        return signer.getCroppedSignature()
    }
}
