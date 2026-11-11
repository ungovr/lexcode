// lexcode-expect: 0
// A local Gather class, with no Twilio import, whose Input list has a SPEECH entry and whose
// builder takes it by the name Gather.Input.SPEECH: a call-flow editor for a test double.
package demo.editor

class Gather {
    enum class Input { DTMF, SPEECH }

    class Builder {
        fun inputs(kinds: List<Input>): Builder = this

        fun inputs(kind: Input): Builder = this
    }
}

fun editorStep(builder: Gather.Builder): Gather.Builder = builder.inputs(listOf(Gather.Input.DTMF, Gather.Input.SPEECH)).inputs(Gather.Input.SPEECH)
