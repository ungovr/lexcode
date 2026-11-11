// lexcode-expect: 0
// Audio and video code that opens no microphone: a screen recorder with a video source only,
// music and tone playback, a speaker line, a CameraX recording without sound, and the call
// audio sources, which belong to records_calls and not to a person's own voice. A local mixer
// has a setAudioSource method of its own and an AudioSource constant list of its own.
package demo.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.MediaPlayer
import android.media.MediaRecorder
import androidx.camera.video.PendingRecording
import javax.sound.sampled.AudioSystem
import javax.sound.sampled.SourceDataLine

class PlaybackAndScreen {
    // Video only: the screen is captured and no audio source is set.
    fun screenRecorder(path: String): MediaRecorder =
        MediaRecorder().apply {
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setOutputFile(path)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            prepare()
        }

    fun playMusic(url: String) {
        val player = MediaPlayer()
        player.setDataSource(url)
        player.prepare()
        player.start()
    }

    fun tone(): AudioTrack {
        val format = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(44100)
            .build()
        return AudioTrack.Builder()
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
            .setAudioFormat(format)
            .build()
    }

    fun speaker(format: javax.sound.sampled.AudioFormat): SourceDataLine = AudioSystem.getSourceDataLine(format)

    // CameraX video with no audio track.
    fun silentClip(pending: PendingRecording, onEvent: (Any) -> Unit) =
        pending.start(java.util.concurrent.Executors.newSingleThreadExecutor()) { onEvent(it) }

    // The audio of a call: both sides, the far side, this side. Recording these is a call recording.
    fun callAudio(): MediaRecorder =
        MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.VOICE_CALL)
            setAudioSource(MediaRecorder.AudioSource.VOICE_DOWNLINK)
            setAudioSource(MediaRecorder.AudioSource.VOICE_UPLINK)
            setAudioSource(MediaRecorder.AudioSource.REMOTE_SUBMIX)
        }
}

// A local mixer, not the platform recorder, with source names borrowed from it.
object AudioSource {
    const val MIC = 1
    const val CAMCORDER = 5
    const val VOICE_RECOGNITION = 6
}

class Mixer(private val channel: Channel) {
    fun configure() {
        channel.setAudioSource("playlist")
        channel.setAudioSource(AudioSource.MIC)
        channel.setAudioSource(AudioSource.CAMCORDER)
        channel.setAudioSource(AudioSource.VOICE_RECOGNITION)
    }
}

class Channel {
    fun setAudioSource(name: Any) {
        println(name)
    }
}

// Names that match the DataLine and AudioRecord shapes without being the platform's.
class DataLine {
    class Info(val type: Class<*>, val format: Any)
}

class TargetDataLine

fun describe(format: Any): DataLine.Info = DataLine.Info(TargetDataLine::class.java, format)
