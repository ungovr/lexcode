// lexcode-expect: 1
// openai-api-rs: a fine-tuning job started on an uploaded training file.
use openai_api_rs::v1::api::OpenAIClient;
use openai_api_rs::v1::fine_tuning::CreateFineTuningJobRequest;

pub async fn tune(client: &mut OpenAIClient, file_id: String) -> Result<(), Box<dyn std::error::Error>> {
    let req = CreateFineTuningJobRequest::new("gpt-4o-mini-2024-07-18".to_string(), file_id);
    let _job = client.create_fine_tuning_job(req).await?;
    Ok(())
}
