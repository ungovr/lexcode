// lexcode-expect: 0
// TwiML that answers a call without recording it: Dial and Conference with recording turned
// off, Say and Gather, and a metrics meter whose record method takes a Duration, in a file
// that imports Dial and Conference.
package demo.calls

import com.twilio.twiml.VoiceResponse
import com.twilio.twiml.voice.Conference
import com.twilio.twiml.voice.Dial
import com.twilio.twiml.voice.Gather
import com.twilio.twiml.voice.Say
import java.time.Duration

class PlainLines(private val meter: Meter) {
    fun bridge(to: String): String {
        val dial = Dial.Builder(to).record(Dial.Record.DO_NOT_RECORD).build()
        return VoiceResponse.Builder().dial(dial).build().toXml()
    }

    fun room(): String {
        val conference = Conference.Builder("support-room").record(Conference.Record.DO_NOT_RECORD).build()
        val dial = Dial.Builder().conference(conference).build()
        return VoiceResponse.Builder().dial(dial).build().toXml()
    }

    fun menu(): String {
        val gather = Gather.Builder().input(Gather.Input.DTMF).say(Say.Builder("Press 1.").build()).build()
        return VoiceResponse.Builder().gather(gather).build().toXml()
    }

    fun timed(elapsed: Duration) {
        meter.record(elapsed)
        meter.record(Duration.ofSeconds(2))
    }
}

class Meter {
    fun record(elapsed: Duration) {
        println(elapsed)
    }
}
