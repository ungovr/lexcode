# lexcode-expect: 6
require "gemini-ai"
require "langchain"

# A service object hands the model's output to its caller. Where it goes is not visible
# here, so each match is a signal.
class ExplainService
  def initialize
    @llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
  end

  def explain(term)
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    reply = llm.chat(messages: [{ role: "user", content: "Explain #{term} simply." }])
    return reply.chat_completion
  end

  def draft(topic)
    llm = Langchain::LLM::Anthropic.new(api_key: ENV.fetch("ANTHROPIC_API_KEY"))
    out = llm.complete(prompt: "Draft a note about #{topic}.")
    note = out.completion
    note
  end
end

class SummaryService
  def summarize_thread(thread)
    result = GEMINI.generate_content({ contents: { role: "user", parts: { text: thread } } })
    text = result.dig("candidates", 0, "content", "parts", 0, "text")
    text
  end

  def describe(photo)
    GEMINI.models.generate_content(model: "gemini-2.5-flash", contents: [photo, "Describe this picture."]).text
    response = GEMINI.models.generate_content(model: "gemini-2.5-flash", contents: [photo, "Describe this picture."])
    response.text
  end

  def self.each_chunk(topic)
    chunks = GEMINI.stream_generate_content({ contents: { role: "user", parts: { text: "Tell a story about #{topic}" } } })
    chunks.each do |chunk|
      yield chunk
    end
  end

  def card(topic)
    result = GEMINI.generate_content({ contents: { role: "user", parts: { text: topic } } })
    return { topic: topic, reply: result.dig("candidates", 0, "content", "parts", 0, "text") }
  end
end

class TitlesController < ApplicationController
  # This action answers the request itself, so the evidence rule owns it and the signal
  # rule stays quiet.
  def create
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    reply = llm.chat(messages: [{ role: "user", content: params[:topic] }])
    render json: { title: reply.chat_completion }
  end
end
