// lexcode-expect: 0
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rodio::{Decoder, OutputStream, Sink};
use std::fs::File;
use std::io::BufReader;

// Playback only: an output stream and rodio play sound and capture nothing.
pub fn beep() -> anyhow::Result<()> {
    let host = cpal::default_host();
    let device = host.default_output_device().expect("no speaker");
    let config = device.default_output_config()?;
    let stream = device.build_output_stream(
        &config.into(),
        |data: &mut [f32], _: &cpal::OutputCallbackInfo| data.fill(0.0),
        |err| eprintln!("{err}"),
        None,
    )?;
    stream.play()?;
    Ok(())
}

pub fn play_file(path: &str) -> anyhow::Result<()> {
    let (_stream, handle) = OutputStream::try_default()?;
    let sink = Sink::try_new(&handle)?;
    sink.append(Decoder::new(BufReader::new(File::open(path)?))?);
    sink.sleep_until_end();
    Ok(())
}

// The app's own settings type named like PortAudio's, with no PortAudio import.
pub struct InputStreamSettings {
    pub rows: usize,
}

impl InputStreamSettings {
    pub fn new(rows: usize) -> Self {
        Self { rows }
    }
}

pub fn form() -> InputStreamSettings {
    InputStreamSettings::new(3)
}
