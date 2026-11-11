// lexcode-expect: 0
// Android calling code that carries a call without keeping it: placing a call, routing audio to
// the speaker, a WebRTC audio module that only carries the call, and recording the user's own
// voice alone (a voice note, which is processes_voice and not this activity). A local mixer
// has a setAudioSource method and an AudioSource list of its own, with the call sources in it.
package demo.calls

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.MediaRecorder
import android.net.Uri
import org.webrtc.audio.JavaAudioDeviceModule

class Dialer {
    fun dial(context: Context, number: String) {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number"))
        context.startActivity(intent)
    }

    fun speakerOn(audio: AudioManager) {
        audio.mode = AudioManager.MODE_IN_COMMUNICATION
        audio.isSpeakerphoneOn = true
    }

    fun carryOnly(context: Context): JavaAudioDeviceModule =
        JavaAudioDeviceModule.builder(context)
            .setUseHardwareAcousticEchoCanceler(true)
            .setUseHardwareNoiseSuppressor(true)
            .createAudioDeviceModule()

    // The user's own voice alone, from the microphone.
    fun voiceMemo(path: String): MediaRecorder =
        MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFile(path)
            prepare()
        }
}

// A local mixer, not the platform recorder, with the platform's source names.
object AudioSource {
    const val VOICE_CALL = 4
    const val VOICE_DOWNLINK = 3
    const val VOICE_UPLINK = 2
}

class Mixer(private val channel: Channel) {
    fun configure() {
        channel.setAudioSource(AudioSource.VOICE_CALL)
        channel.setAudioSource(AudioSource.VOICE_DOWNLINK)
        channel.setAudioSource(AudioSource.VOICE_UPLINK)
    }
}

class Channel {
    fun setAudioSource(source: Int) {
        println(source)
    }
}

class AudioRecord(val source: Int, val rate: Int)

fun probe(): AudioRecord = AudioRecord(AudioSource.VOICE_CALL, 8000)

// The platform's constant handed to a recorder class of the app's own, not android.media.AudioRecord.
fun synthetic(): AudioRecord = AudioRecord(MediaRecorder.AudioSource.VOICE_CALL, 8000)
