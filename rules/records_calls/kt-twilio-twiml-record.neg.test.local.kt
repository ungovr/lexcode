// lexcode-expect: 0
// A call-flow simulator with no Twilio import, whose own Record, Dial and Conference types
// have the same shapes as TwiML's: a Record builder, and a Dial whose Record setting is an
// enum with RECORD_ values, set from a constant and from a parameter.
package demo.simulator

class Record {
    class Builder {
        fun maxLength(seconds: Int): Builder = this

        fun build(): Record = Record()
    }
}

class Dial {
    enum class Record { DO_NOT_RECORD, RECORD_FROM_ANSWER, RECORD_FROM_RINGING }

    class Builder(private val to: String) {
        fun record(setting: Dial.Record): Builder = this
    }
}

class Conference {
    enum class Record { DO_NOT_RECORD, RECORD_FROM_START }

    class Builder(private val name: String) {
        fun record(setting: Conference.Record): Builder = this
    }
}

class Simulator {
    fun voicemail(): Record = Record.Builder().maxLength(30).build()

    fun bridge(to: String): Dial.Builder = Dial.Builder(to).record(Dial.Record.RECORD_FROM_ANSWER)

    fun bridgeWith(to: String, setting: Dial.Record): Dial.Builder = Dial.Builder(to).record(setting)

    fun roomRecorded(): Conference.Builder = Conference.Builder("room").record(Conference.Record.RECORD_FROM_START)

    fun room(setting: Conference.Record): Conference.Builder = Conference.Builder("room").record(setting)
}
