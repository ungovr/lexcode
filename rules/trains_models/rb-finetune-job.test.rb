# lexcode-expect: 5
# Hosted fine-tuning of a vendor model on data the app collected: ruby-openai, the official
# openai gem, AWS Bedrock model customization and SageMaker training jobs.
require "openai"
require "aws-sdk-bedrock"
require "aws-sdk-sagemaker"

class FineTuneSupportModelJob < ApplicationJob
  queue_as :default

  def perform(account_id)
    account = Account.find(account_id)
    file = client.files.upload(
      parameters: { file: account.export_transcripts_jsonl, purpose: "fine-tune" }
    )
    response = client.finetunes.create(
      parameters: { training_file: file["id"], model: "gpt-4o-mini-2024-07-18" }
    )
    account.update!(fine_tune_job_id: response["id"])
  end

  private

  def client
    @client ||= OpenAI::Client.new(access_token: Rails.application.credentials.openai_key)
  end
end

class LegacyTuner
  def start(training_file_id)
    openai = OpenAI::Client.new
    openai.fine_tunes.create parameters: { training_file: training_file_id, model: "davinci" }
  end
end

class OfficialGemTuner
  def start(training_file_id)
    openai = OpenAI::Client.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    job = openai.fine_tuning.jobs.create(model: "gpt-4.1-mini-2025-04-14", training_file: training_file_id)
    job.id
  end
end

class BedrockCustomizer
  def start(bucket)
    bedrock = Aws::Bedrock::Client.new(region: "us-east-1")
    bedrock.create_model_customization_job(
      job_name: "support-tune",
      custom_model_name: "support-v1",
      base_model_identifier: "amazon.titan-text-lite-v1",
      training_data_config: { s3_uri: "s3://#{bucket}/train.jsonl" },
      output_data_config: { s3_uri: "s3://#{bucket}/out/" },
      role_arn: ENV["BEDROCK_ROLE_ARN"]
    )
  end
end

class SageMakerTrainer
  def start(name, image)
    Aws::SageMaker::Client.new.create_training_job(
      training_job_name: name,
      algorithm_specification: { training_image: image, training_input_mode: "File" },
      role_arn: ENV["SAGEMAKER_ROLE_ARN"]
    )
  end
end
