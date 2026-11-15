// lexcode-expect: 0
import AWSRekognition
import Foundation

// Finding faces and labels names no one: a photo is not biometric data, recognizing someone from
// one is. The Azure detect endpoint only finds faces.
struct PhotoTagger {
    let client: RekognitionClient

    func countFaces(photo: Data) async throws -> Int {
        let output = try await client.detectFaces(input: DetectFacesInput(image: RekognitionClientTypes.Image(bytes: photo)))
        return output.faceDetails?.count ?? 0
    }

    func labels(photo: Data) async throws {
        _ = try await client.detectLabels(input: DetectLabelsInput(image: RekognitionClientTypes.Image(bytes: photo)))
    }

    let detect = URL(string: "https://example.cognitiveservices.azure.com/face/v1.0/detect")!
}
