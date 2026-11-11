// lexcode-expect: 7
// Enrolling and matching a speaker's voiceprint from Kotlin: Amazon Connect Voice ID through
// the AWS SDK for Kotlin (speaker enrollment, fraudster registration, session evaluation) and
// Azure Speech speaker verification and identification.
package demo.voice

import aws.sdk.kotlin.services.voiceid.VoiceIdClient
import com.microsoft.cognitiveservices.speech.speaker.SpeakerIdentificationModel
import com.microsoft.cognitiveservices.speech.speaker.SpeakerRecognizer
import com.microsoft.cognitiveservices.speech.speaker.SpeakerVerificationModel
import com.microsoft.cognitiveservices.speech.speaker.VoiceProfile
import com.microsoft.cognitiveservices.speech.speaker.VoiceProfileClient

class VoiceAuth(private val voiceId: VoiceIdClient) {
    suspend fun enroll(domain: String) =
        voiceId.startSpeakerEnrollmentJob {
            domainId = domain
        }

    suspend fun registerFraudster(domain: String) =
        voiceId.startFraudsterRegistrationJob {
            domainId = domain
        }

    suspend fun evaluate(domain: String, session: String) =
        voiceId.evaluateSession {
            domainId = domain
            sessionNameOrId = session
        }

    fun verifyModel(profile: VoiceProfile): SpeakerVerificationModel = SpeakerVerificationModel.fromProfile(profile)

    fun identifyModel(profiles: List<VoiceProfile>): SpeakerIdentificationModel = SpeakerIdentificationModel.fromProfiles(profiles)

    fun profiles(config: com.microsoft.cognitiveservices.speech.SpeechConfig): VoiceProfileClient = VoiceProfileClient(config)

    fun recognizer(config: com.microsoft.cognitiveservices.speech.SpeechConfig): SpeakerRecognizer = SpeakerRecognizer(config, null)
}
