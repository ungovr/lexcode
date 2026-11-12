// lexcode-expect: 0
// A file that imports the Twilio Call and Room classes and uses them without recording: a
// plain call, a call with recording explicitly off, a call update, a text message, and a
// room with participant recording off.
package demo.calls

import com.twilio.rest.api.v2010.account.Call
import com.twilio.rest.api.v2010.account.Message
import com.twilio.rest.video.v1.Room
import com.twilio.type.PhoneNumber
import java.net.URI

class QuietDialer {
    fun plain(to: String, from: String, url: String) {
        Call.creator(PhoneNumber(to), PhoneNumber(from), URI.create(url)).create()
    }

    fun explicitOff(to: String, from: String, url: String) {
        Call.creator(PhoneNumber(to), PhoneNumber(from), URI.create(url)).setRecord(false).create()
    }

    fun hangUp(sid: String) {
        Call.updater(sid).setStatus(Call.UpdateStatus.COMPLETED).update()
    }

    fun text(to: String, from: String) {
        Message.creator(PhoneNumber(to), PhoneNumber(from), "Your table is ready").create()
    }

    fun room() {
        Room.creator().setUniqueName("standup").setRecordParticipantsOnConnect(false).create()
    }
}
