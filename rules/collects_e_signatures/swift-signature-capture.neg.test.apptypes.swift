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

// A diagram of the signing chain the tool draws for its report, with the app's own drawing
// type: the same shape as a PencilKit read-back, kept out only by the missing `import PencilKit`.
struct ChainDiagram {
    func image(from rect: CGRect, scale: CGFloat) -> Data { Data() }
    func dataRepresentation() -> Data { Data() }
}

struct SignatureChainReport {
    let signatureCanvas = (drawing: ChainDiagram(), bounds: CGRect.zero)

    func export() async throws -> [Data] {
        [signatureCanvas.drawing.image(from: signatureCanvas.bounds, scale: 2),
         signatureCanvas.drawing.dataRepresentation()]
    }
}
