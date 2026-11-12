// lexcode-expect: 3
// The same calls with wildcard imports.
package demo.calls

import com.twilio.rest.api.v2010.account.*
import com.twilio.rest.video.v1.*
import com.twilio.type.PhoneNumber
import java.net.URI

class WildcardDialer {
    fun support(to: String, from: String, url: String) {
        Call.creator(PhoneNumber(to), PhoneNumber(from), URI.create(url)).setRecord(true).create()
    }

    fun standup() {
        Room.creator().setUniqueName("standup").setRecordParticipantsOnConnect(true).create()
    }

    fun recording(callSid: String) {
        com.twilio.rest.api.v2010.account.call.Recording.creator(callSid).create()
    }
}
