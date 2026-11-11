// lexcode-expect: 5
// Recording a phone call on Android through the call audio sources, and taking the audio
// of a WebRTC call as it plays and as it is captured.
package demo.calls;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import java.io.IOException;
import org.webrtc.audio.JavaAudioDeviceModule;

public class CallRecorder {
  MediaRecorder bothSides(String path) throws IOException {
    MediaRecorder recorder = new MediaRecorder();
    recorder.setAudioSource(MediaRecorder.AudioSource.VOICE_CALL);
    recorder.setOutputFile(path);
    recorder.prepare();
    return recorder;
  }

  AudioRecord otherSide(int bufferSize) {
    return new AudioRecord(
        MediaRecorder.AudioSource.VOICE_DOWNLINK,
        16000,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
        bufferSize);
  }

  AudioRecord mySide() {
    return new AudioRecord.Builder()
        .setAudioSource(MediaRecorder.AudioSource.VOICE_UPLINK)
        .setBufferSizeInBytes(4096)
        .build();
  }

  JavaAudioDeviceModule webrtcTap(android.content.Context context, JavaAudioDeviceModule.SamplesReadyCallback tap) {
    return JavaAudioDeviceModule.builder(context)
        .setSamplesReadyCallback(tap)
        .setPlaybackSamplesReadyCallback(tap::onWebRtcAudioRecordSamplesReady)
        .createAudioDeviceModule();
  }
}
