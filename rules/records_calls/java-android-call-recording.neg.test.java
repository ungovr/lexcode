// lexcode-expect: 0
// Android calling code that carries a call without keeping it: placing a call, routing
// audio to the speaker, a WebRTC audio module that only carries the call, and recording the
// user's own voice alone (a voice note, which is processes_voice and not this activity).
package demo.calls;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.media.MediaRecorder;
import android.net.Uri;
import java.io.IOException;
import org.webrtc.audio.JavaAudioDeviceModule;

public class Dialer {
  void dial(Context context, String number) {
    Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number));
    context.startActivity(intent);
  }

  void speakerOn(AudioManager audio) {
    audio.setMode(AudioManager.MODE_IN_COMMUNICATION);
    audio.setSpeakerphoneOn(true);
  }

  JavaAudioDeviceModule carryOnly(Context context) {
    return JavaAudioDeviceModule.builder(context)
        .setUseHardwareAcousticEchoCanceler(true)
        .setUseHardwareNoiseSuppressor(true)
        .createAudioDeviceModule();
  }

  // The user's own voice alone, from the microphone.
  MediaRecorder voiceMemo(String path) throws IOException {
    MediaRecorder recorder = new MediaRecorder();
    recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    recorder.setOutputFile(path);
    recorder.prepare();
    return recorder;
  }
}
