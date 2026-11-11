// lexcode-expect: 2
// The same calls with the wildcard import of the TwiML voice package: the speech Gather and
// the transcribing voicemail Record.
package demo.voice

import com.twilio.twiml.VoiceResponse
import com.twilio.twiml.voice.*

class WildcardAssistant {
    fun listen(): String {
        val gather = Gather.Builder().inputs(Gather.Input.SPEECH).build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun voicemail(): String {
        val record = Record.Builder().transcribe(true).build()
        return VoiceResponse.Builder().record(record).build().toXml()
    }
}
