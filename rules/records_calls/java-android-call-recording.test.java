// lexcode-expect: 3
// Recording a phone call on Android through the call audio sources: both sides, the far
// side as an AudioRecord, and the near side through the AudioRecord builder.
package demo.calls;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import java.io.IOException;

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
}
