// lexcode-expect: 2
// async-openai: a fine-tuning job started on the app's own training file, through a nested
// `use` group (the crate's documented form) and through an alias.
use async_openai as oai;
use async_openai::{config::OpenAIConfig, types::{CreateFineTuningJobRequestArgs}, Client};

pub async fn tune(client: &Client<OpenAIConfig>, file_id: &str) -> anyhow::Result<String> {
    let request = CreateFineTuningJobRequestArgs::default()
        .model("gpt-4o-mini-2024-07-18")
        .training_file(file_id)
        .build()?;
    let job = client
        .fine_tuning()
        .create(request)
        .await?;
    Ok(job.id)
}

pub async fn tune_again(request: async_openai::types::CreateFineTuningJobRequest) -> anyhow::Result<()> {
    let _job = oai::Client::new().fine_tuning().create(request).await?;
    Ok(())
}
