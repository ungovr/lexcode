// lexcode-expect: 4
// A WebRTC call whose audio samples are handed to the app as they are captured and played,
// the hook an app uses to save or analyze a call: callbacks passed as an object and as lambdas.
package demo.calls

import android.content.Context
import org.webrtc.audio.JavaAudioDeviceModule

class TappedCall(private val context: Context, private val sink: SampleSink) {
    fun module(): JavaAudioDeviceModule =
        JavaAudioDeviceModule.builder(context)
            .setSamplesReadyCallback { samples -> sink.write(samples.data) }
            .setPlaybackSamplesReadyCallback { samples -> sink.write(samples.data) }
            .createAudioDeviceModule()

    fun withObjects(builder: JavaAudioDeviceModule.Builder, mic: JavaAudioDeviceModule.SamplesReadyCallback, speaker: JavaAudioDeviceModule.PlaybackSamplesReadyCallback) {
        builder.setSamplesReadyCallback(mic)
        builder.setPlaybackSamplesReadyCallback(speaker)
    }
}

class SampleSink {
    fun write(data: ByteArray) {
        println(data.size)
    }
}
