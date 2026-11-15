// lexcode-expect: 3
// AWS SDK for Rust: a SageMaker training job and a tuning job, and a Bedrock model
// customization job.
use aws_sdk_bedrock as bedrock;
use aws_sdk_sagemaker::{types::AlgorithmSpecification, Client};

pub async fn train(client: &Client, spec: AlgorithmSpecification) -> anyhow::Result<()> {
    client
        .create_training_job()
        .training_job_name("churn-v2")
        .algorithm_specification(spec)
        .send()
        .await?;
    client.create_hyper_parameter_tuning_job().hyper_parameter_tuning_job_name("churn-hpo").send().await?;
    Ok(())
}

pub async fn customize(client: &bedrock::Client) -> anyhow::Result<()> {
    let _job = client
        .create_model_customization_job()
        .job_name("support-tone")
        .base_model_identifier("amazon.titan-text-express-v1")
        .send()
        .await?;
    Ok(())
}
