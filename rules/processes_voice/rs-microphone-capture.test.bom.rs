use cpal::traits::{DeviceTrait, HostTrait};
// lexcode-expect: 1
// A file saved with a UTF-8 byte order mark before its first line, which is the use line: the
// use guard reads the line after the mark.

pub fn record() -> anyhow::Result<()> {
    let device = cpal::default_host().default_input_device().expect("no microphone");
    let config = device.default_input_config()?;
    let _stream = device.build_input_stream(&config.into(), |_data: &[f32], _: &cpal::InputCallbackInfo| {}, |_e| {}, None)?;
    Ok(())
}
