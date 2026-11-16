// lexcode-expect: 0
// Calling models somebody else trained: a chat completion, a training file uploaded but no job
// started, the existing jobs listed, a SageMaker endpoint invoked and a training job read back.
use async_openai::{config::OpenAIConfig, Client};
use async_openai::types::{CreateChatCompletionRequestArgs, CreateFileRequestArgs, FilePurpose};
use aws_sdk_sagemaker as sagemaker;
use aws_sdk_sagemakerruntime as smr;

pub async fn answer(client: &Client<OpenAIConfig>, question: &str) -> anyhow::Result<()> {
    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o-mini")
        .messages([question.into()])
        .build()?;
    let _reply = client.chat().create(request).await?;
    let upload = CreateFileRequestArgs::default()
        .file("support.jsonl")
        .purpose(FilePurpose::FineTune)
        .build()?;
    let _file = client.files().create(upload).await?;
    let _jobs = client.fine_tuning().list_paginated(None, Some(10)).await?;
    Ok(())
}

pub async fn infer(rt: &smr::Client, sm: &sagemaker::Client) -> anyhow::Result<()> {
    let _out = rt.invoke_endpoint().endpoint_name("churn").send().await?;
    let _job = sm.describe_training_job().training_job_name("churn-v1").send().await?;
    Ok(())
}
