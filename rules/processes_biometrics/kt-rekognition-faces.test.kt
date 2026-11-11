// lexcode-expect: 7
// Matching or indexing faces with Amazon Rekognition from Kotlin, through the AWS SDK for
// Kotlin (builder lambdas) and its collection and user-vector calls.
package demo.faces

import aws.sdk.kotlin.services.rekognition.RekognitionClient
import aws.sdk.kotlin.services.rekognition.model.Image

class FaceLogin(private val rekognition: RekognitionClient) {
    suspend fun sameAsId(selfie: ByteArray, idPhoto: ByteArray) =
        rekognition.compareFaces {
            sourceImage = Image { bytes = selfie }
            targetImage = Image { bytes = idPhoto }
        }

    suspend fun enroll(selfie: ByteArray) =
        rekognition.indexFaces {
            collectionId = "members"
            image = Image { bytes = selfie }
        }

    suspend fun whoIsThis(selfie: ByteArray) =
        rekognition.searchFacesByImage {
            collectionId = "members"
            image = Image { bytes = selfie }
        }

    suspend fun byFaceId(id: String) = rekognition.searchFaces { collectionId = "members"; faceId = id }

    suspend fun user(selfie: ByteArray) = rekognition.searchUsersByImage { collectionId = "members"; image = Image { bytes = selfie } }

    suspend fun users(id: String) = rekognition.searchUsers { collectionId = "members"; userId = id }

    suspend fun video(arn: String) = rekognition.startFaceSearch { collectionId = "members" }
}
