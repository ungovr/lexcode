# lexcode-expect: 27
require "anthropic"
require "openai"

class SummariesController < ApplicationController
  # ruby-openai: the model's summary is the response body.
  def create
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
    response = client.chat(
      parameters: {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Summarize: #{params[:text]}" }]
      }
    )
    render json: { summary: response.dig("choices", 0, "message", "content") }
  end
end

class HeadlinesController < ApplicationController
  # The official openai gem; the text is read out of the completion first.
  def show
    openai = OpenAI::Client.new(api_key: ENV["OPENAI_API_KEY"])
    completion = openai.chat.completions.create(
      messages: [{ role: "user", content: "Write a headline about #{params[:topic]}" }],
      model: "gpt-4o-mini"
    )
    headline = completion.choices.first.message.content.strip
    render plain: headline
  end
end

class RewritesController < ApplicationController
  def create
    claude = Anthropic::Client.new(api_key: ENV["ANTHROPIC_API_KEY"])
    message = claude.messages.create(
      max_tokens: 1024,
      messages: [{ role: "user", content: "Rewrite plainly: #{params[:text]}" }],
      model: "claude-sonnet-4-5"
    )
    respond_to do |format|
      format.json { render json: { text: message.content.first.text } }
      format.html { render html: message.content.first.text }
    end
  end
end

class DraftsController < ApplicationController
  # The Responses API through ruby-openai, with the call written inline in the render.
  def create
    client = OpenAI::Client.new
    render json: client.responses.create(parameters: { model: "gpt-5", input: "Draft a reply to the latest email." })
  end
end

class TaglinesController < ApplicationController
  # ruby_llm: the chat object is made first and asked later.
  def show
    chat = RubyLLM.chat(model: "gpt-4o-mini")
    reply = chat.ask("Write a tagline for #{params[:product]}")
    render json: { tagline: reply.content }
  end
end

class ExplanationsController < ApplicationController
  # AWS Bedrock's Converse API.
  def show
    bedrock = Aws::BedrockRuntime::Client.new(region: "us-east-1")
    resp = bedrock.converse(
      model_id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: [{ role: "user", content: [{ text: "Explain #{params[:term]} simply." }] }]
    )
    render json: { text: resp.output.message.content.first.text }
  end
end

# A background job writes the model's text into a channel the user is watching.
class DraftJob < ApplicationJob
  def perform(draft_id, prompt)
    openai = OpenAI::Client.new
    completion = openai.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }])
    text = completion.choices.first.message.content
    ActionCable.server.broadcast("drafts_#{draft_id}", { text: text })
  end
end

# Sinatra.
class Api < Sinatra::Base
  post "/translate" do
    chat = RubyLLM.chat
    answer = chat.ask("Translate to French: #{params[:text]}")
    json(translation: answer.content)
  end
end

class StreamsController < ApplicationController
  include ActionController::Live

  # Text streamed to the browser as server-sent events.
  def show
    response.headers["Content-Type"] = "text/event-stream"
    client = OpenAI::Client.new
    reply = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    response.stream.write("data: #{reply.dig('choices', 0, 'message', 'content')}\n\n")
  ensure
    response.stream.close
  end
end

class ChunksController < ApplicationController
  include ActionController::Live

  # ruby_llm streams through a block given to ask.
  def show
    response.headers["Content-Type"] = "text/event-stream"
    chat = RubyLLM.chat(model: "gpt-4o-mini")
    chat.ask(params[:q]) do |chunk|
      response.stream.write("data: #{chunk.content}\n\n")
    end
  ensure
    response.stream.close
  end
end

class EventsController < ApplicationController
  include ActionController::Live

  # The official openai gem streams a Responses call as an enumerable of events.
  def show
    openai = OpenAI::Client.new
    stream = openai.responses.stream(input: "Write a haiku about #{params[:topic]}.", model: "gpt-5")
    stream.each do |event|
      response.stream.write(event.to_json)
    end
  ensure
    response.stream.close
  end
end

class TokensController < ApplicationController
  include ActionController::Live

  # ruby-openai streams through a proc given as the stream parameter.
  def show
    client = OpenAI::Client.new
    client.chat(
      parameters: {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: params[:q] }],
        stream: proc do |chunk, _bytesize|
          response.stream.write(chunk.dig("choices", 0, "delta", "content"))
        end
      }
    )
  ensure
    response.stream.close
  end
end

# The implicit view: an action that sets an instance variable and names no other response
# renders its template (app/views/briefs/show.html.erb), which shows the variable.
class BriefsController < ApplicationController
  def show
    client = OpenAI::Client.new
    response = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Brief me on #{params[:topic]}" }] })
    @brief = response.dig("choices", 0, "message", "content")
  end

  # An explicit template render shows the same variables.
  def update
    @brief = RubyLLM.chat.ask("Shorten: #{params[:text]}").content
    render :show
  end
end

module Help
  # The variable is set in a before_action callback, for every action's view.
  class AnswersController < ApplicationController
    before_action :set_answer

    def show; end

    private

    def set_answer
      chat = RubyLLM.chat(model: "gpt-4o-mini")
      @answer ||= chat.ask(params[:q]).content
    end
  end
end

# The model's text reaches the person through a partial, the response body, or a Turbo
# broadcast from the record it was saved to.
class NotePanelsController < ApplicationController
  def show
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    render partial: "panels/panel", locals: { value: result.dig("choices", 0, "message", "content") }
  end

  def raw
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    response.body = result.dig("choices", 0, "message", "content")
  end
end

class NoteReplyJob < ApplicationJob
  def perform(thread_id, params)
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    message = Message.create!(thread_id: thread_id, role: "assistant", content: result.dig("choices", 0, "message", "content"))
    message.broadcast_append_to("thread_#{thread_id}", target: "messages")
  end

  def refresh(record, params)
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    record.update!(content: result.dig("choices", 0, "message", "content"))
    record.broadcast_replace_later_to(record.thread)
  end
end

# Sinatra: a route's value is the response body, and a template the route renders shows its
# instance variables.
class NoteRoutes < Sinatra::Base
  get "/notes/:id" do |id|
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    result.dig("choices", 0, "message", "content")
  end

  post "/notes" do
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    @value = result.dig("choices", 0, "message", "content")
    erb :notes
  end
end

# ActionController::Metal sets the body itself, and an Action Cable channel broadcasts to one
# subscriber.
class FastNotesController < ActionController::Metal
  def show
    client = OpenAI::Client.new
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:q] }] })
    self.response_body = result.dig("choices", 0, "message", "content")
  end
end

class NoteDigestJob < ApplicationJob
  def perform(user, client)
    result = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Summarize my notes." }] })
    NotesChannel.broadcast_to(user, { text: result.dig("choices", 0, "message", "content") })
  end
end
