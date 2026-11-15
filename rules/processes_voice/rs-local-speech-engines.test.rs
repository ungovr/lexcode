// lexcode-expect: 7
use candle_transformers::models::whisper::{self as m, audio, Config};
use sherpa_rs::{read_audio_file, whisper::{WhisperConfig, WhisperRecognizer}};
use sherpa_rs::diarize::{Diarize, DiarizeConfig};
use vosk::{Model, Recognizer};
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

pub fn transcribe_file(model_path: &str, samples: &[f32]) -> anyhow::Result<String> {
    let ctx = WhisperContext::new_with_params(model_path, WhisperContextParameters::default())?;
    let mut state = ctx.create_state()?;
    let params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    state.full(params, samples)?;
    let _legacy = WhisperContext::new(model_path)?;
    Ok(state.full_get_segment_text(0)?)
}

pub fn vosk_command(pcm: &[i16]) -> String {
    let model = Model::new("models/vosk-small-en").unwrap();
    let mut rec = Recognizer::new(&model, 16000.0).unwrap();
    rec.accept_waveform(pcm).unwrap();
    let mut commands = Recognizer::new_with_grammar(&model, 16000.0, &["lights on", "lights off"]).unwrap();
    commands.accept_waveform(pcm).unwrap();
    format!("{:?}", rec.final_result())
}

pub fn candle_front_end(config: &Config, pcm: &[f32], filters: &[f32], vb: candle_nn::VarBuilder) -> anyhow::Result<()> {
    let _mel = audio::pcm_to_mel(config, pcm, filters);
    let _model = m::model::Whisper::load(&vb, config.clone())?;
    Ok(())
}

pub fn sherpa(path: &str) -> anyhow::Result<()> {
    let (samples, rate) = read_audio_file(path)?;
    let mut rec = WhisperRecognizer::new(WhisperConfig::default())?;
    let _text = rec.transcribe(rate, &samples);
    let mut who = Diarize::new("seg.onnx", "emb.onnx", DiarizeConfig::default())?;
    let _turns = who.compute(samples, None)?;
    Ok(())
}
