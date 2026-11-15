// lexcode-expect: 4
use kalosm::sound::*;
use vosk as vk;
use whisper_rs as wr;

pub fn by_alias(model: &vk::Model, bytes: &[u8]) -> anyhow::Result<()> {
    let _rec = vk::Recognizer::new(model, 16000.0);
    let _ctx = wr::WhisperContext::new_from_buffer_with_params(bytes, wr::WhisperContextParameters::default())?;
    Ok(())
}

pub async fn kalosm_listen() -> anyhow::Result<()> {
    let model = Whisper::builder().build().await?;
    let _same = Whisper::new().await?;
    let mic = MicInput::default();
    let _text = mic.stream().transcribe(model);
    Ok(())
}
