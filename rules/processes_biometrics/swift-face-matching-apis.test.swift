// lexcode-expect: 10
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

    func sameAsEnrolled(faceID: String, collection: String) async throws {
        _ = try await client.searchFaces(input: SearchFacesInput(collectionId: collection, faceId: faceID))
    }

    // A user vector: faces attached to one person, then searched by that user.
    func enrollUser(userID: String, faceIDs: [String], collection: String) async throws {
        _ = try await client.associateFaces(input: AssociateFacesInput(collectionId: collection, faceIds: faceIDs, userId: userID))
        _ = try await client.searchUsers(input: SearchUsersInput(collectionId: collection, userId: userID))
    }

    func searchVideo(collection: String, video: RekognitionClientTypes.Video) async throws {
        _ = try await client.startFaceSearch(input: StartFaceSearchInput(collectionId: collection, video: video))
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
