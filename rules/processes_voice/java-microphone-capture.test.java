// lexcode-expect: 5
// Opening the microphone: Android MediaRecorder and AudioRecord with a microphone
// source, and the desktop JVM's javax.sound target line.
package demo.audio;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import java.io.IOException;
import javax.sound.sampled.AudioFormat.Encoding;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.DataLine;
import javax.sound.sampled.TargetDataLine;

public class MicrophoneCapture {
  MediaRecorder voiceNote(String path) throws IOException {
    MediaRecorder recorder = new MediaRecorder();
    recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    recorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
    recorder.setOutputFile(path);
    recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
    recorder.prepare();
    return recorder;
  }

  AudioRecord rawStream(int bufferSize) {
    return new AudioRecord(
        MediaRecorder.AudioSource.VOICE_RECOGNITION,
        16000,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
        bufferSize);
  }

  AudioRecord builderStream() {
    return new AudioRecord.Builder()
        .setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
        .setBufferSizeInBytes(4096)
        .build();
  }

  TargetDataLine desktopMic(javax.sound.sampled.AudioFormat format) throws Exception {
    return AudioSystem.getTargetDataLine(format);
  }

  TargetDataLine desktopMicByInfo(javax.sound.sampled.AudioFormat format) throws Exception {
    DataLine.Info info = new DataLine.Info(TargetDataLine.class, format);
    return (TargetDataLine) AudioSystem.getLine(info);
  }
}
