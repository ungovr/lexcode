# lexcode-expect: 0
# Model calls whose output stays with the team that runs them, and lookalikes that call no model.
require "anthropic"
require "json"
require "net/http"
require "openai"

# bin/weekly_digest.rb: a maintainer runs it and reads the terminal.
client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
response = client.chat(
  parameters: {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Summarize this week's open issues for the maintainers." }]
  }
)
digest = response.dig("choices", 0, "message", "content")
puts digest
File.write("tmp/digest.md", digest)
Rails.logger.info("digest written: #{digest[0, 80]}")

# lib/tasks/support.rake: the output goes to a Slack channel the support team reads.
namespace :support do
  desc "Explain the failing jobs for the on-call engineer"
  task explain_failures: :environment do
    claude = Anthropic::Client.new
    message = claude.messages.create(
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: "Explain these failures: #{FailedJob.recent.pluck(:error).join("\n")}" }]
    )
    note = message.content.first.text
    Net::HTTP.post(URI("https://hooks.slack.com/services/T000/B000/XXXX"), { text: note }.to_json)
    warn note
  end
end

# The labels are written to an internal table the team queries.
class TicketLabeler
  def initialize(client = OpenAI::Client.new)
    @client = client
  end

  def run(tickets)
    tickets.each do |ticket|
      reply = @client.chat(
        parameters: {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "One word label for: #{ticket.title}" }]
        }
      )
      label = reply.dig("choices", 0, "message", "content")
      InternalLabel.create!(ticket_id: ticket.id, label: label)
    end
  end
end

# A maintainer's command object: the text goes to the terminal, a log and a file, and the
# method's own value is not the model's text.
class DigestCommand
  def call(client)
    response = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Summarize the open issues." }] })
    text = response.dig("choices", 0, "message", "content")
    File.write("tmp/digest.md", text)
    Rails.logger.info(response.dig("choices", 0, "message", "content"))
  end

  def print_it(client)
    response = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Summarize the open issues." }] })
    puts response.dig("choices", 0, "message", "content")
  end

  def save_it(client, record)
    response = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Label this ticket." }] })
    label = response.dig("choices", 0, "message", "content")
    record.update(label: label)
  end
end

# Routes that call no model.
class JobsController < ApplicationController
  def create
    job = Job.find_by!(name: params[:name])
    render json: { name: job.name, ran: true }
  end
end

class PagesController < ApplicationController
  def show
    # Content a person wrote, which the app only reads back, is not generated text.
    page = Page.find(params[:id])
    render json: { body: page.body }
  end
end

class ThreadsController < ApplicationController
  def create
    # A message table with a create method is not the Messages API.
    thread = ChatThread.find(params[:id])
    message = thread.messages.create(role: "user", content: params[:content])
    render json: message
  end
end

class SurveysController < ApplicationController
  def create
    # A survey table with a create method is not the Responses API.
    row = survey.responses.create(survey_id: params[:survey_id], answers: params[:answers])
    render json: { id: row.id }
  end
end

class SearchController < ApplicationController
  def index
    # Embeddings and moderation are not generated text.
    embedding = OPENAI.embeddings(parameters: { model: "text-embedding-3-small", input: params[:q] }).dig("data", 0, "embedding")
    flagged = OPENAI.moderations(parameters: { input: params[:q] }).dig("results", 0, "flagged")
    render json: { flagged: flagged, hits: Doc.nearest_neighbors(:embedding, embedding).limit(10) }
  end
end

class VectorsController < ApplicationController
  def show
    vector = RubyLLM.embed(params[:text]).vectors
    render json: { vector: vector }
  end
end

# Command-line prompt libraries ask people questions with a block; no model is called.
class SetupWizard
  def name(prompt)
    prompt.ask("Your name?") do |q|
      q.required true
      q.modify :strip
    end
  end

  def email(prompt)
    prompt.ask("Email?") { |q| q.validate(/@/) }
  end

  def confirm(cli)
    answer = cli.ask("Proceed? (y/n)") { |q| q.in = %w[y n] }
    answer
  end
end
