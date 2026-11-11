// lexcode-expect: 0
// A local Gather class, with no Twilio import, whose Input list has a SPEECH entry and whose
// builder takes it by the name Gather.Input.SPEECH: a call-flow editor for a test double.
package demo.editor

class Gather {
    enum class Input { DTMF, SPEECH }

    class Builder {
        fun input(vararg kinds: Input): Builder = this
    }
}

fun editorStep(builder: Gather.Builder): Gather.Builder = builder.input(Gather.Input.DTMF, Gather.Input.SPEECH)
