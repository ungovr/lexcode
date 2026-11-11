// lexcode-expect: 0
// WebRTC audio code that takes no sample callback, with the WebRTC types written in full and
// no import, and a local audio pipeline with setSamplesReadyCallback and
// setPlaybackSamplesReadyCallback methods of its own, called on a receiver.
package demo.calls;

public class CallAudioPlain {
  org.webrtc.audio.JavaAudioDeviceModule carryOnly(android.content.Context context) {
    return org.webrtc.audio.JavaAudioDeviceModule.builder(context)
        .setUseHardwareAcousticEchoCanceler(true)
        .setUseHardwareNoiseSuppressor(true)
        .createAudioDeviceModule();
  }
}

// A local audio pipeline that shares the callback names.
class MeterPipeline {
  private final Pipeline pipeline;

  MeterPipeline(Pipeline pipeline) {
    this.pipeline = pipeline;
  }

  void wire(Runnable tap) {
    pipeline.setSamplesReadyCallback(tap);
    pipeline.setPlaybackSamplesReadyCallback(tap);
  }
}

interface Pipeline {
  void setSamplesReadyCallback(Runnable tap);

  void setPlaybackSamplesReadyCallback(Runnable tap);
}
