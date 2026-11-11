// lexcode-expect: 0
// A WebRTC audio module that carries a call without tapping its samples, with the module's
// type written in full and no WebRTC import, and a local audio pipeline whose methods are
// named like the module builder's sample callbacks.
package demo.calls

class Pipeline(private val builder: PipelineBuilder) {
    fun configure() {
        builder.setSamplesReadyCallback { println(it) }
        builder.setSamplesReadyCallback(Tap())
        builder.setPlaybackSamplesReadyCallback { println(it) }
        builder.setPlaybackSamplesReadyCallback(Tap())
    }

    fun carryOnly(context: android.content.Context): org.webrtc.audio.JavaAudioDeviceModule =
        org.webrtc.audio.JavaAudioDeviceModule.builder(context)
            .setUseHardwareAcousticEchoCanceler(true)
            .createAudioDeviceModule()
}

class Tap

class PipelineBuilder {
    fun setSamplesReadyCallback(callback: (Any) -> Unit): PipelineBuilder = this

    fun setSamplesReadyCallback(callback: Tap): PipelineBuilder = this

    fun setPlaybackSamplesReadyCallback(callback: (Any) -> Unit): PipelineBuilder = this

    fun setPlaybackSamplesReadyCallback(callback: Tap): PipelineBuilder = this
}
