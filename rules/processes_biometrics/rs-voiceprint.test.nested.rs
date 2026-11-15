// lexcode-expect: 3
use sherpa_rs::{embedding_manager::EmbeddingManager, speaker_id::{EmbeddingExtractor, ExtractorConfig}};
use vosk as vk;

pub fn nested(samples: Vec<f32>) -> anyhow::Result<()> {
    let mut extractor = EmbeddingExtractor::new(ExtractorConfig::default())?;
    let embedding = extractor.compute_speaker_embedding(samples, 16000)?;
    let mut manager = EmbeddingManager::new(embedding.len() as i32);
    manager.add("caller".into(), &mut embedding.clone())?;
    Ok(())
}

pub fn alias() {
    let _spk = vk::SpeakerModel::new("spk");
}
