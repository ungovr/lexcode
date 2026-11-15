// lexcode-expect: 6
import AWSRekognition
import Foundation

// Face matching through Amazon Rekognition, from a Vapor or Lambda handler.
struct FaceCheck {
    let client: RekognitionClient

    func sameperson(selfie: Data, idPhoto: Data) async throws -> Bool {
        let output = try await client.compareFaces(input: CompareFacesInput(
            similarityThreshold: 90,
            sourceImage: RekognitionClientTypes.Image(bytes: selfie),
            targetImage: RekognitionClientTypes.Image(bytes: idPhoto)
        ))
        return !(output.faceMatches ?? []).isEmpty
    }

    func enroll(photo: Data, collection: String, userID: String) async throws {
        _ = try await client.indexFaces(input: IndexFacesInput(collectionId: collection, externalImageId: userID, image: RekognitionClientTypes.Image(bytes: photo)))
    }

    func whoIs(photo: Data, collection: String) async throws {
        _ = try await client
            .searchFacesByImage(input: SearchFacesByImageInput(collectionId: collection, image: RekognitionClientTypes.Image(bytes: photo)))
    }

    func findUser(photo: Data, collection: String) async throws {
        _ = try await client.searchUsersByImage(input: SearchUsersByImageInput(collectionId: collection, image: RekognitionClientTypes.Image(bytes: photo)))
    }
}

// Azure AI Face and Face++ reached over HTTP.
struct FaceEndpoints {
    let endpoint: String
    var identify: URL { URL(string: "\(endpoint)/face/v1.0/identify")! }
    let compare = URL(string: "https://api-us.faceplusplus.com/facepp/v3/compare")!
}
