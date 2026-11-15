// lexcode-expect: 0
import ARKit
import UIKit
import Vision

// Finding where a face is, to center a crop on it, measures no geometry and names no one; a
// capture-quality score rates the picture. World tracking follows the room, not a face.
final class ThumbnailCropper {
    func faceBounds(in image: CGImage) throws -> [CGRect] {
        let request = VNDetectFaceRectanglesRequest()
        request.revision = VNDetectFaceRectanglesRequestRevision3
        try VNImageRequestHandler(cgImage: image).perform([request])
        return (request.results ?? []).map(\.boundingBox)
    }

    func bestShot(in image: CGImage) throws {
        let quality = VNDetectFaceCaptureQualityRequest()
        try VNImageRequestHandler(cgImage: image).perform([quality])
    }

    @available(iOS 18.0, *)
    func faces(in image: CGImage) async throws -> Int {
        try await DetectFaceRectanglesRequest().perform(on: image).count
    }

    var canTrackFaces: Bool { ARFaceTrackingConfiguration.isSupported }

    func room(session: ARSession) {
        session.run(ARWorldTrackingConfiguration())
    }
}
