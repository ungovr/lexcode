// lexcode-expect: 8
// Opening the microphone from Kotlin: a MediaRecorder configured in an apply block, the same
// call on a receiver, an AudioRecord built directly and through its builder, the voice
// recognition and communication sources, a javax.sound capture line, and a CameraX recording
// with its audio enabled.
package demo.audio

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.camera.video.PendingRecording
import java.util.concurrent.Executor
import javax.sound.sampled.AudioSystem
import javax.sound.sampled.DataLine
import javax.sound.sampled.TargetDataLine

class VoiceMemo {
    fun memo(path: String): MediaRecorder =
        MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.AMR_NB)
            setOutputFile(path)
            prepare()
        }

    fun onReceiver(recorder: MediaRecorder) {
        recorder.setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
    }

    fun raw(): AudioRecord =
        AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, 16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, 4096)

    fun built(format: AudioFormat): AudioRecord =
        AudioRecord.Builder()
            .setAudioSource(MediaRecorder.AudioSource.UNPROCESSED)
            .setAudioFormat(format)
            .build()

    fun desktop(format: javax.sound.sampled.AudioFormat): TargetDataLine = AudioSystem.getTargetDataLine(format)

    fun desktopInfo(format: javax.sound.sampled.AudioFormat): DataLine.Info = DataLine.Info(TargetDataLine::class.java, format)

    fun clip(pending: PendingRecording, executor: Executor) =
        pending.withAudioEnabled().start(executor) { println(it) }

    fun clipUnmuted(pending: PendingRecording, executor: Executor) =
        pending.withAudioEnabled(false).start(executor) { println(it) }
}
