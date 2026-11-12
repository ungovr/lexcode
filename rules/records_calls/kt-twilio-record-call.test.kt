// lexcode-expect: 4
// Placing a Twilio call or opening a video room with recording on, passing the choice in a
// variable, and listing-style creation of a recording for a live call.
package demo.calls

import com.twilio.rest.api.v2010.account.Call
import com.twilio.rest.api.v2010.account.call.Recording
import com.twilio.rest.video.v1.Room
import com.twilio.type.PhoneNumber
import java.net.URI

class RecordedDialer {
    fun support(to: String, from: String, url: String) {
        Call.creator(PhoneNumber(to), PhoneNumber(from), URI.create(url)).setRecord(true).create()
    }

    fun configurable(to: String, from: String, url: String, keep: Boolean) {
        Call.creator(PhoneNumber(to), PhoneNumber(from), URI.create(url)).setRecord(keep).create()
    }

    fun standup() {
        Room.creator().setUniqueName("standup").setRecordParticipantsOnConnect(true).create()
    }

    fun startRecording(callSid: String) {
        Recording.creator(callSid).create()
    }
}
