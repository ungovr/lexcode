// lexcode-expect: 11
use sherpa_rs::{embedding_manager, speaker_id};
use vosk::{Model, Recognizer, SpeakerModel};

pub fn vosk_speaker(pcm: &[i16]) -> String {
    let model = Model::new("models/vosk-en").unwrap();
    let speaker = SpeakerModel::new("models/vosk-spk").unwrap();
    let mut rec = Recognizer::new_with_speaker(&model, 16000.0, &speaker).unwrap();
    let mut plain = Recognizer::new(&model, 16000.0).unwrap();
    plain.set_speaker_model(&speaker);
    rec.accept_waveform(pcm).unwrap();
    format!("{:?}", rec.final_result())
}

pub fn sherpa_speaker(samples: Vec<f32>) -> anyhow::Result<Option<String>> {
    let mut extractor = speaker_id::EmbeddingExtractor::new(speaker_id::ExtractorConfig::default())?;
    let embedding = extractor.compute_speaker_embedding(samples, 16000)?;
    let mut manager = embedding_manager::EmbeddingManager::new(extractor.embedding_size.try_into()?);
    manager.add("caller-42".into(), &mut embedding.clone())?;
    Ok(manager.search(&embedding, 0.5))
}

pub async fn voice_id(client: &aws_sdk_voiceid::Client, domain: &str, session: &str) -> anyhow::Result<()> {
    client.start_speaker_enrollment_job().domain_id(domain).send().await?;
    client.start_fraudster_registration_job().domain_id(domain).send().await?;
    let _decision = client
        .evaluate_session()
        .domain_id(domain)
        .session_name_or_id(session)
        .send()
        .await?;
    Ok(())
}

pub async fn by_address(http: &reqwest::Client, endpoint: &str, user: &str) -> anyhow::Result<()> {
    http.post(format!("https://api.voiceit.io/enrollments/voice/{user}")).send().await?;
    http.post(format!("{endpoint}/speaker-recognition/verification/text-independent/profiles")).send().await?;
    http.post(format!("{endpoint}/speaker/identification/v2.0/text-independent/profiles")).send().await?;
    Ok(())
}
