// lexcode-expect: 0
// Calls that sit beside Amazon Rekognition face matching and are not it. Amazon Rekognition
// detection (a face box and attributes, labels, text, moderation) names no person, and the
// Rekognition types are written in full here with no import. A local photo library has
// compareFaces, indexFaces, searchFaces and searchUsers methods of its own and calls them on a
// receiver, which is the shape the matching calls take.
package demo.faces

class PhotoScreening {
    private val rekognition = software.amazon.awssdk.services.rekognition.RekognitionClient.create()

    private fun image(bytes: ByteArray) =
        software.amazon.awssdk.services.rekognition.model.Image.builder()
            .bytes(software.amazon.awssdk.core.SdkBytes.fromByteArray(bytes))
            .build()

    fun countFaces(bytes: ByteArray): Int =
        rekognition
            .detectFaces(software.amazon.awssdk.services.rekognition.model.DetectFacesRequest.builder().image(image(bytes)).build())
            .faceDetails()
            .size

    fun labels(bytes: ByteArray): Any =
        rekognition.detectLabels(
            software.amazon.awssdk.services.rekognition.model.DetectLabelsRequest.builder().image(image(bytes)).build(),
        )
}

// A local photo library that shares method names with the matching calls.
class PhotoLibrary(private val library: Library) {
    fun sameAlbum(a: String, b: String): Boolean = library.compareFaces(a, b)

    fun add(name: String) {
        library.indexFaces(name)
    }

    fun find(name: String): Any {
        library.searchFaces(name)
        library.searchFacesByImage(name)
        library.searchUsers(name)
        library.searchUsersByImage(name)
        library.compareFaces { name }
        return library.startFaceSearch(name)
    }
}

interface Library {
    fun compareFaces(a: String, b: String): Boolean

    fun compareFaces(block: () -> String): Boolean

    fun indexFaces(name: String)

    fun searchFaces(name: String): Any

    fun searchFacesByImage(name: String): Any

    fun searchUsers(name: String): Any

    fun searchUsersByImage(name: String): Any

    fun startFaceSearch(name: String): Any
}
