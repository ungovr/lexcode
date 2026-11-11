// lexcode-expect: 5
// Answering a Twilio call with TwiML that records it: a Record verb, a Dial that records the
// bridged call, a Conference that records the room, and a Dial whose recording mode arrives
// in a parameter of Twilio's own type.
package demo.calls

import com.twilio.twiml.VoiceResponse
import com.twilio.twiml.voice.Conference
import com.twilio.twiml.voice.Dial
import com.twilio.twiml.voice.Record

class RecordedLines {
    fun leaveMessage(): String {
        val record = Record.Builder().maxLength(120).playBeep(true).build()
        return VoiceResponse.Builder().record(record).build().toXml()
    }

    fun bridgeRecorded(to: String): String {
        val dial = Dial.Builder(to).record(Dial.Record.RECORD_FROM_ANSWER_DUAL).build()
        return VoiceResponse.Builder().dial(dial).build().toXml()
    }

    fun recordedRoom(): String {
        val conference = Conference.Builder("support-room")
            .record(Conference.Record.RECORD_FROM_START)
            .build()
        val dial = Dial.Builder().conference(conference).build()
        return VoiceResponse.Builder().dial(dial).build().toXml()
    }

    fun bridgeWithSetting(to: String, setting: Dial.Record): String {
        val dial = Dial.Builder(to).record(setting).build()
        return VoiceResponse.Builder().dial(dial).build().toXml()
    }

    fun roomWithSetting(setting: Conference.Record): Conference =
        Conference.Builder("support-room").record(setting).build()
}
