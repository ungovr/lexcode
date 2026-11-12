// lexcode-expect: 4
// Taking a caller's speech through Twilio TwiML: a Gather that listens for speech (alone and
// alongside keypad digits) and a voicemail Record that asks Twilio to transcribe.
package demo.voice

import com.twilio.twiml.VoiceResponse
import com.twilio.twiml.voice.Gather
import com.twilio.twiml.voice.Record
import com.twilio.twiml.voice.Say

class Assistant {
    fun listen(): String {
        val gather = Gather.Builder()
            .inputs(Gather.Input.SPEECH)
            .action("/handle-speech")
            .say(Say.Builder("How can I help you?").build())
            .build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun listenOrKeys(): String {
        val gather = Gather.Builder()
            .inputs(listOf(Gather.Input.DTMF, Gather.Input.SPEECH))
            .action("/handle")
            .build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun listenMutable(): String {
        val gather = Gather.Builder()
            .inputs(mutableListOf(Gather.Input.SPEECH))
            .action("/handle")
            .build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun voicemail(): String {
        val record = Record.Builder().transcribe(true).transcribeCallback("/transcribed").maxLength(60).build()
        return VoiceResponse.Builder().record(record).build().toXml()
    }
}
