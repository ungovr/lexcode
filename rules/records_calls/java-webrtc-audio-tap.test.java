// lexcode-expect: 2
// Taking the audio of a WebRTC call as it plays and as it is captured on Android. The
// callbacks may feed a recorder, a recognizer or a level meter, which is why this rule is a
// signal and not evidence of recording.
package demo.calls;

import android.content.Context;
import org.webrtc.audio.JavaAudioDeviceModule;

public class CallAudioTap {
  JavaAudioDeviceModule capture(Context context, JavaAudioDeviceModule.SamplesReadyCallback tap) {
    return JavaAudioDeviceModule.builder(context).setSamplesReadyCallback(tap).createAudioDeviceModule();
  }

  JavaAudioDeviceModule playback(Context context, JavaAudioDeviceModule.PlaybackSamplesReadyCallback tap) {
    return JavaAudioDeviceModule.builder(context).setPlaybackSamplesReadyCallback(tap).createAudioDeviceModule();
  }
}
