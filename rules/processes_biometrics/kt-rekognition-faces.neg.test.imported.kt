// lexcode-expect: 0
// A file that imports the AWS SDK for Kotlin's Rekognition client and uses only detection:
// a face box and attributes, labels, text and moderation labels. Detection names no person.
package demo.faces

import aws.sdk.kotlin.services.rekognition.RekognitionClient
import aws.sdk.kotlin.services.rekognition.model.Image

class Screening(private val rekognition: RekognitionClient) {
    suspend fun countFaces(bytes: ByteArray): Int {
        val response = rekognition.detectFaces {
            image = Image { this.bytes = bytes }
        }
        return response.faceDetails?.size ?: 0
    }

    suspend fun labels(bytes: ByteArray) =
        rekognition.detectLabels {
            image = Image { this.bytes = bytes }
        }

    suspend fun text(bytes: ByteArray) =
        rekognition.detectText {
            image = Image { this.bytes = bytes }
        }

    suspend fun moderation(bytes: ByteArray) =
        rekognition.detectModerationLabels {
            image = Image { this.bytes = bytes }
        }
}
