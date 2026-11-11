// lexcode-expect: 0
// A signal-processing demo with an AudioRecord class and an AudioSystem object of its own, the
// first taking the platform's source constants, and a CameraX-looking withAudioEnabled method on a screencast helper that
// is not CameraX. The file imports MediaRecorder for the constants only, and no CameraX.
package demo.dsp

import android.media.MediaRecorder

class AudioRecord(val source: Int, val rate: Int)

class Screencast {
    fun withAudioEnabled(): Screencast = this

    fun withAudioEnabled(muted: Boolean): Screencast = this
}

object AudioSystem {
    fun getTargetDataLine(format: Any): Any = format
}

class Demo(private val cast: Screencast) {
    fun open(): AudioRecord {
        cast.withAudioEnabled()
        cast.withAudioEnabled(false)
        AudioSystem.getTargetDataLine("pcm")
        return AudioRecord(MediaRecorder.AudioSource.MIC, 44100)
    }
}
