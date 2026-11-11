// lexcode-expect: 3
// The same constants reached through the other import styles: the nested AudioSource class
// imported by itself, a wildcard import of android.media, and the source written in full.
package demo.audio

import android.media.*
import android.media.MediaRecorder.AudioSource

class ImportStyles {
    fun nested(): MediaRecorder = MediaRecorder().apply { setAudioSource(AudioSource.CAMCORDER) }

    fun raw(): AudioRecord = AudioRecord(AudioSource.MIC, 44100, 16, 2, 1024)

    fun qualified(recorder: MediaRecorder) {
        recorder.setAudioSource(android.media.MediaRecorder.AudioSource.DEFAULT)
    }
}
