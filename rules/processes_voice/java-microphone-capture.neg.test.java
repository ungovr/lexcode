// lexcode-expect: 0
// Audio and video code that opens no microphone: a screen recorder with a video source
// only, music and tone playback, a speaker line, and a local class with a setAudioSource
// method of its own.
package demo.audio;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import java.io.IOException;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.SourceDataLine;

public class PlaybackAndScreen {
  // Video only: the screen is captured and no audio source is set.
  MediaRecorder screenRecorder(String path) throws IOException {
    MediaRecorder recorder = new MediaRecorder();
    recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
    recorder.setOutputFile(path);
    recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
    recorder.prepare();
    return recorder;
  }

  void playMusic(String url) throws IOException {
    MediaPlayer player = new MediaPlayer();
    player.setDataSource(url);
    player.prepare();
    player.start();
  }

  AudioTrack tone() {
    AudioFormat format = new AudioFormat.Builder()
        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
        .setSampleRate(44100)
        .build();
    return new AudioTrack.Builder()
        .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
        .setAudioFormat(format)
        .build();
  }

  SourceDataLine speaker(javax.sound.sampled.AudioFormat format) throws Exception {
    return AudioSystem.getSourceDataLine(format);
  }
}

// A local mixer, not the platform recorder.
class Mixer {
  private final Channel channel;

  Mixer(Channel channel) {
    this.channel = channel;
  }

  void configure() {
    channel.setAudioSource("playlist");
  }
}

interface Channel {
  void setAudioSource(String name);
}
