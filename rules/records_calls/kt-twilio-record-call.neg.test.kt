// lexcode-expect: 0
// Twilio calls and video rooms placed without recording, written with the Twilio types in
// full and no Twilio REST import, and a booking desk whose entries have a setRecord method of
// its own, called on a receiver the way the Twilio creators are. A local Recording class has a
// creator of its own.
package demo.calls

class Dialer {
    fun place(to: String, from: String, url: String) {
        com.twilio.rest.api.v2010.account.Call.creator(
            com.twilio.type.PhoneNumber(to),
            com.twilio.type.PhoneNumber(from),
            java.net.URI.create(url),
        ).create()
    }

    fun text(to: String, from: String) {
        com.twilio.rest.api.v2010.account.Message.creator(
            com.twilio.type.PhoneNumber(to),
            com.twilio.type.PhoneNumber(from),
            "Your table is ready",
        ).create()
    }

    fun room() {
        com.twilio.rest.video.v1.Room.creator().setUniqueName("standup").create()
    }
}

// A booking desk, not Twilio.
class Desk(private val entry: Entry, private val lobby: Entry) {
    fun mark() {
        entry.setRecord(true)
        entry.setRecord("archived")
        lobby.setRecordParticipantsOnConnect(true)
        Recording.creator("call-1")
    }
}

class Entry {
    fun setRecord(value: Any) {
        println(value)
    }

    fun setRecordParticipantsOnConnect(value: Boolean) {
        println(value)
    }
}

class Recording {
    companion object {
        fun creator(callSid: String): Recording = Recording()
    }
}
