// lexcode-expect: 0
// Voice and call code that does not build or match a voiceprint: an Amazon Connect outbound
// contact and Azure speech recognition and synthesis, with the vendor types written in full and
// no vendor import. A call desk with startSpeakerEnrollmentJob, startFraudsterRegistrationJob
// and evaluateSession methods of its own calls them on a receiver, and local models and
// clients named like the Azure speaker classes.
package demo.voice

class OutboundCalls {
    private val connect = software.amazon.awssdk.services.connect.ConnectClient.create()

    fun callBack(instanceId: String): Any =
        connect.startOutboundVoiceContact(
            software.amazon.awssdk.services.connect.model.StartOutboundVoiceContactRequest.builder().instanceId(instanceId).build(),
        )

    fun transcribe(key: String, region: String) {
        val config = com.microsoft.cognitiveservices.speech.SpeechConfig.fromSubscription(key, region)
        val synthesizer = com.microsoft.cognitiveservices.speech.SpeechSynthesizer(config)
        synthesizer.SpeakText("Thank you for calling")
    }
}

// A call desk that shares method names with Voice ID.
class CallDesk(private val desk: Desk) {
    fun triage(name: String) {
        desk.startSpeakerEnrollmentJob(name)
        desk.startFraudsterRegistrationJob(name)
        desk.evaluateSession(name)
        desk.evaluateSession { name }
    }

    fun models(profile: String): List<Any> =
        listOf(
            SpeakerVerificationModel.fromProfile(profile),
            SpeakerIdentificationModel.fromProfiles(listOf(profile)),
            VoiceProfileClient(profile),
            SpeakerRecognizer(profile),
        )
}

interface Desk {
    fun startSpeakerEnrollmentJob(name: String)

    fun startFraudsterRegistrationJob(name: String)

    fun evaluateSession(name: String)

    fun evaluateSession(block: () -> String)
}

class SpeakerVerificationModel {
    companion object {
        fun fromProfile(profile: String): SpeakerVerificationModel = SpeakerVerificationModel()
    }
}

class SpeakerIdentificationModel {
    companion object {
        fun fromProfiles(profiles: List<String>): SpeakerIdentificationModel = SpeakerIdentificationModel()
    }
}

class VoiceProfileClient(val name: String)

class SpeakerRecognizer(val name: String)
