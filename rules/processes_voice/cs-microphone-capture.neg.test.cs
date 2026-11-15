// lexcode-expect: 0
// Playing sound and recording video without sound, which open no microphone: NAudio playback, a
// MediaRecorder with only a video source, an audio player on iOS and the .NET MAUI audio plugin's
// player, a microphone source held but given to no recorder, and the call's own audio (VoiceCall, which
// is records_calls territory). Look-alikes: the app's own AudioSource list passed to its own
// SetAudioSource, and the app's own WaveInEvent class in another namespace.
using Android.Media;
using AVFoundation;
using Contoso.Mixer;
using NAudio.Wave;
using Plugin.Maui.Audio;

namespace Contoso.Playback;

public sealed class PlaybackService(IAudioManager audioManager)
{
    public void Desktop(string path)
    {
        using var reader = new AudioFileReader(path);
        using var output = new WaveOutEvent();
        output.Init(reader);
        output.Play();
    }

    public void Android(string file)
    {
        var recorder = new MediaRecorder();
        recorder.SetVideoSource(VideoSource.Camera);
        recorder.SetOutputFile(file);
        var source = AudioSource.Mic;
        var callAudio = new MediaRecorder();
        callAudio.SetAudioSource(AudioSource.VoiceCall);
    }

    public void Ios(Foundation.NSUrl url)
    {
        var player = AVAudioPlayer.FromUrl(url);
        player?.Play();
    }

    public async Task MauiAsync(Stream clip)
    {
        var player = audioManager.CreatePlayer(clip);
        player.Play();
        await Task.CompletedTask;
    }

    public void Mixer(MixerChannel channel)
    {
        channel.SetAudioSource(Contoso.Mixer.AudioSource.Mic);
        var input = new Contoso.Mixer.WaveInEvent();
        input.Start();
    }
}
