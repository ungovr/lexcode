// lexcode-expect: 7
// The rest of the microphone sources: NAudio's windowed WaveIn built and target-typed, WASAPI capture
// target-typed, and .NET for Android's default, camcorder, unprocessed and voice-performance sources,
// the last on an AudioRecord that is target-typed.
using Android.Media;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace Contoso.VoiceNotes;

public sealed class StudioRecorder
{
    public void Desktop()
    {
        var waveIn = new WaveIn();
        WaveIn windowed = new() { BufferMilliseconds = 50 };
        WasapiCapture capture = new();
        capture.StartRecording();
    }

    public void Android(MediaRecorder recorder, MediaRecorder video)
    {
        recorder.SetAudioSource(AudioSource.Default);
        video.SetAudioSource(AudioSource.Camcorder);
        var raw = new AudioRecord(AudioSource.Unprocessed, 48000, ChannelIn.Stereo, Encoding.PcmFloat, 8192);
        AudioRecord performance = new(AudioSource.VoicePerformance, 48000, ChannelIn.Mono, Encoding.Pcm16bit, 4096);
    }
}
