// lexcode-expect: 2
// Voice ID through the AWS SDK for Java from Kotlin: version 2 (a wildcard import) and version 1.
package demo.voice

import com.amazonaws.services.voiceid.AmazonVoiceID
import software.amazon.awssdk.services.voiceid.*

class JavaVoiceAuth(private val v2: VoiceIdClient, private val v1: AmazonVoiceID) {
    fun enroll(request: software.amazon.awssdk.services.voiceid.model.StartSpeakerEnrollmentJobRequest) =
        v2.startSpeakerEnrollmentJob(request)

    fun evaluate(request: com.amazonaws.services.voiceid.model.EvaluateSessionRequest) = v1.evaluateSession(request)
}
