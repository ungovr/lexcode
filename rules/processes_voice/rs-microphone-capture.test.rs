// lexcode-expect: 4
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use portaudio as pa;
use std::sync::mpsc::Sender;

pub fn record(tx: Sender<Vec<f32>>) -> anyhow::Result<cpal::Stream> {
    let host = cpal::default_host();
    let device = host.default_input_device().expect("no microphone");
    let config = device.default_input_config()?;
    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            tx.send(data.to_vec()).ok();
        },
        |err| eprintln!("input error: {err}"),
        None,
    )?;
    stream.play()?;
    Ok(stream)
}

pub fn record_raw(device: &cpal::Device, config: &cpal::StreamConfig) -> anyhow::Result<cpal::Stream> {
    Ok(device.build_input_stream_raw(config, cpal::SampleFormat::I16, |_data, _info| {}, |_e| {}, None)?)
}

pub fn port_audio() -> Result<(), pa::Error> {
    let port = pa::PortAudio::new()?;
    let params = port.default_input_stream_params::<f32>(1)?;
    let _settings = pa::InputStreamSettings::new(params, 16_000.0, 256);
    Ok(())
}
