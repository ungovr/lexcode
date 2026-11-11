# lexcode-expect: 10
require "anthropic"
require "openai"

# A service object hands the model's text to its caller. Where that text goes is not visible
# here, so each match is a signal.
class SummaryService
  def initialize(client: OpenAI::Client.new)
    @client = client
  end

  def summarize(text)
    response = @client.chat(
      parameters: {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Summarize:\n#{text}" }]
      }
    )
    return response.dig("choices", 0, "message", "content")
  end

  def draft_reply(email)
    response = @client.chat(
      parameters: {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Draft a polite reply to:\n#{email}" }]
      }
    )
    reply = response.dig("choices", 0, "message", "content")
    reply
  end

  def card(email)
    response = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: email }] })
    return { email: email, reply: response.dig("choices", 0, "message", "content") }
  end

  def each_sentence(topic)
    response = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Tell a story about #{topic}" }] })
    text = response.dig("choices", 0, "message", "content")
    yield text
  end
end

class Rewriter
  def self.plain(text)
    claude = Anthropic::Client.new
    message = claude.messages.create(
      max_tokens: 600,
      messages: [{ role: "user", content: "Rewrite plainly:\n#{text}" }],
      model: "claude-sonnet-4-5"
    )
    out = message.content.first.text
    out
  end

  def describe(name)
    chat = RubyLLM.chat(model: "gpt-4o-mini")
    answer = chat.ask("Describe #{name} in two sentences.")
    answer.content.strip
    return answer.content
  end

  def explain(term)
    completion = OpenAI::Client.new.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: term }])
    completion.choices.first.message.content
    completion
  end

  def title
    # The last expression of a method is its value, with or without a return.
    response = OpenAI::Client.new.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Name a cat." }] })
    response.dig("choices", 0, "message", "content")
  end

  def slogan
    message = Anthropic::Client.new.messages.create(max_tokens: 50, messages: [{ role: "user", content: "A slogan." }], model: "claude-sonnet-4-5")
    message.content.first.text
  end

  def shout
    response = OpenAI::Client.new.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Say hi." }] })
    response.dig("choices", 0, "message", "content").upcase
  end
end

class TaglinesController < ApplicationController
  # This action answers the request itself, so the evidence rule owns it and the signal
  # rule stays quiet.
  def create
    client = OpenAI::Client.new
    response = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: params[:topic] }] })
    render json: { tagline: response.dig("choices", 0, "message", "content") }
  end
end
