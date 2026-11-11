# lexcode-expect: 0
# Calling somebody else's model, including one fine-tuned by somebody else, is not training one.
# Listing, reading and cancelling jobs, uploading files and managing models start no training.
require "openai"
require "aws-sdk-bedrock"
require "aws-sdk-bedrockruntime"

class SupportReplyJob < ApplicationJob
  def perform(ticket_id)
    ticket = Ticket.find(ticket_id)
    reply = client.chat(
      parameters: {
        model: "ft:gpt-4o-mini-2024-07-18:acme::A1b2C3d4",
        messages: [{ role: "user", content: ticket.body }]
      }
    )
    ticket.update!(draft: reply.dig("choices", 0, "message", "content"))
  end

  private

  def client
    @client ||= OpenAI::Client.new
  end
end

class FineTuneStatus
  def initialize
    @client = OpenAI::Client.new
  end

  def jobs
    @client.fine_tuning.jobs.list
  end

  def one(id)
    @client.finetunes.retrieve(id: id)
  end

  def cancel(id)
    @client.finetunes.cancel(id: id)
  end

  def events(id)
    @client.finetunes.list_events(id: id)
  end

  def upload(path)
    @client.files.upload(parameters: { file: path, purpose: "assistants" })
  end

  def embed(text)
    @client.embeddings(parameters: { model: "text-embedding-3-small", input: text })
  end
end

class BedrockReader
  def jobs
    Aws::Bedrock::Client.new.list_model_customization_jobs
  end

  def ask(prompt)
    Aws::BedrockRuntime::Client.new.invoke_model(model_id: "amazon.titan-text-lite-v1", body: { inputText: prompt }.to_json)
  end
end

class Account < ApplicationRecord
  has_many :invoices

  def start_billing
    invoices.create(period: Date.current)
  end
end
