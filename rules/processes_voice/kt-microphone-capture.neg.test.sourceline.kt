// lexcode-expect: 0
// A speaker line described through the platform's DataLine.Info with a different class literal:
// playback needs no microphone. The file imports DataLine and SourceDataLine.
package demo.audio

import javax.sound.sampled.AudioFormat
import javax.sound.sampled.AudioSystem
import javax.sound.sampled.DataLine
import javax.sound.sampled.SourceDataLine

class Speaker {
    fun open(format: AudioFormat): SourceDataLine {
        val info = DataLine.Info(SourceDataLine::class.java, format)
        return AudioSystem.getLine(info) as SourceDataLine
    }
}
