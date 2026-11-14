// lexcode-expect: 9
// Opening the microphone: NAudio capture (imported, aliased, and a target-typed field), .NET for
// Android's MediaRecorder, AudioRecord.Builder and AudioRecord with a microphone source, iOS's
// AVAudioRecorder, and the .NET MAUI audio plugin's recorder, injected and through its default instance.
using Android.Media;
using AVFoundation;
using NAudio.Wave;
using Plugin.Maui.Audio;
using Wasapi = NAudio.CoreAudioApi;

namespace Contoso.VoiceNotes;

public sealed class VoiceNoteRecorder(IAudioManager audioManager)
{
    private readonly WaveInEvent _input = new() { WaveFormat = new WaveFormat(16000, 1) };

    public void Desktop(string path)
    {
        var waveIn = new WaveInEvent { DeviceNumber = 0, WaveFormat = new WaveFormat(44100, 1) };
        var writer = new WaveFileWriter(path, waveIn.WaveFormat);
        waveIn.DataAvailable += (s, e) => writer.Write(e.Buffer, 0, e.BytesRecorded);
        waveIn.StartRecording();
        using var capture = new Wasapi.WasapiCapture();
        capture.StartRecording();
    }

    public void Android(string file)
    {
        var recorder = new MediaRecorder();
        recorder.SetAudioSource(AudioSource.Mic);
        recorder.SetOutputFormat(OutputFormat.Mpeg4);
        recorder.SetOutputFile(file);
        recorder.Prepare();
        recorder.Start();

        var built = new AudioRecord.Builder().SetAudioSource(AudioSource.VoiceRecognition).Build();
        var raw = new AudioRecord(AudioSource.VoiceCommunication, 16000, ChannelIn.Mono, Encoding.Pcm16bit, 4096);
    }

    public void Ios(Foundation.NSUrl url, AudioSettings settings)
    {
        var recorder = AVAudioRecorder.Create(url, settings, out var error);
        recorder?.Record();
    }

    public async Task MauiAsync()
    {
        var recorder = audioManager.CreateRecorder();
        await recorder.StartAsync();
        var other = AudioManager.Current.CreateRecorder();
    }
}
