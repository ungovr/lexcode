// lexcode-expect: 5
import ARKit
import Vision

final class FaceMeasure {
    func landmarks(in image: CGImage) throws {
        let request = VNDetectFaceLandmarksRequest { request, _ in
            let faces = request.results as? [VNFaceObservation] ?? []
            print(faces.compactMap { $0.landmarks?.leftEye?.normalizedPoints })
        }
        try VNImageRequestHandler(cgImage: image).perform([request])
    }

    func landmarksWithHandler(in image: CGImage) throws {
        let request = VNDetectFaceLandmarksRequest(completionHandler: nil)
        let plain = VNDetectFaceLandmarksRequest()
        try VNImageRequestHandler(cgImage: image).perform([request, plain])
    }

    @available(iOS 18.0, macOS 15.0, *)
    func swiftVision(in image: CGImage) async throws {
        let observations = try await DetectFaceLandmarksRequest().perform(on: image)
        print(observations.count)
    }

    func track(session: ARSession) {
        guard ARFaceTrackingConfiguration.isSupported else { return }
        let configuration = ARFaceTrackingConfiguration()
        configuration.maximumNumberOfTrackedFaces = 1
        session.run(configuration)
    }
}
