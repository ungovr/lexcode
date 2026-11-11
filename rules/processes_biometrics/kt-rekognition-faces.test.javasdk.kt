// lexcode-expect: 3
// The AWS SDK for Java clients from Kotlin: version 2 with a named import, and version 1 with
// a wildcard import.
package demo.faces

import com.amazonaws.services.rekognition.*
import software.amazon.awssdk.services.rekognition.RekognitionClient
import software.amazon.awssdk.services.rekognition.model.CompareFacesRequest

class JavaFaceLogin(private val v2: RekognitionClient, private val v1: AmazonRekognition) {
    fun compare(request: CompareFacesRequest) = v2.compareFaces(request)

    fun legacyIndex(request: com.amazonaws.services.rekognition.model.IndexFacesRequest) = v1.indexFaces(request)

    fun legacySearch(request: com.amazonaws.services.rekognition.model.SearchFacesByImageRequest) = v1.searchFacesByImage(request)
}
