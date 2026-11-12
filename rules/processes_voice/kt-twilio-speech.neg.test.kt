// lexcode-expect: 0
// Twilio TwiML that reads text to a caller or collects keypad digits: no speech is taken in.
// Say, Pause and a digits-only Gather, and a voicemail Record that does not transcribe. The
// file imports only Say, Pause and Gather. A local voicemail job has a transcribe(true)
// method of its own, called on a receiver, the shape of the Twilio Record builder's call, and
// a local Gather class has an Input list of its own with a SPEECH entry.
package demo.voice

import com.twilio.twiml.VoiceResponse
import com.twilio.twiml.voice.Gather
import com.twilio.twiml.voice.Pause
import com.twilio.twiml.voice.Say

class Menu {
    fun greeting(): String =
        VoiceResponse.Builder()
            .say(Say.Builder("Thanks for calling.").build())
            .pause(Pause.Builder().length(1).build())
            .build()
            .toXml()

    fun keypadMenu(): String {
        val gather = Gather.Builder()
            .inputs(Gather.Input.DTMF)
            .numDigits(1)
            .action("/menu")
            .say(Say.Builder("Press 1 for sales, 2 for support.").build())
            .build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun keypadList(): String {
        val gather = Gather.Builder().inputs(listOf(Gather.Input.DTMF)).numDigits(1).build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun plainRecording(): String {
        val record = com.twilio.twiml.voice.Record.Builder().maxLength(60).build()
        return VoiceResponse.Builder().record(record).build().toXml()
    }
}

// A local voicemail job that shares the transcribe(true) call shape.
class VoicemailJob(private val options: Options) {
    fun configure() {
        options.transcribe(true)
    }
}

interface Options {
    fun transcribe(on: Boolean): Options
}

// A local survey widget with an Input list that has a SPEECH entry.
class SurveyGather {
    enum class Input { DTMF, SPEECH }

    fun inputs(kinds: List<Input>): SurveyGather = this

    fun inputs(kind: Input): SurveyGather = this
}

fun survey(widget: SurveyGather): SurveyGather = widget.inputs(listOf(SurveyGather.Input.DTMF, SurveyGather.Input.SPEECH)).inputs(SurveyGather.Input.SPEECH)
