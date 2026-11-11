# lexcode-expect: 5
require "langchain"

class ArticlesController < ApplicationController
  # Langchain.rb: the model's output is the response body.
  def create
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"), default_options: { chat_model: "gpt-4o" })
    response = llm.chat(messages: [{ role: "user", content: "Write an intro about #{params[:topic]}." }])
    render json: { text: response.chat_completion }
  end
end

class CompletionsController < ApplicationController
  def show
    llm = Langchain::LLM::Anthropic.new(api_key: ENV.fetch("ANTHROPIC_API_KEY"))
    response = llm.complete(prompt: "Once upon a time, #{params[:hero]}")
    render plain: response.completion
  end
end

class LocalController < ApplicationController
  # A model served locally by Ollama counts the same as a vendor's.
  def show
    llm = Langchain::LLM::Ollama.new(url: "http://localhost:11434")
    reply = llm.chat(messages: [{ role: "user", content: params[:q] }])
    render html: reply.chat_completion
  end
end

class DraftJob < ApplicationJob
  def perform(draft_id, prompt)
    llm = Langchain::LLM::GoogleGemini.new(api_key: ENV.fetch("GOOGLE_GEMINI_API_KEY"))
    text = llm.chat(messages: [{ role: "user", content: prompt }]).chat_completion
    ActionCable.server.broadcast("drafts_#{draft_id}", { text: text })
  end
end

class Api < Sinatra::Base
  post "/rewrite" do
    llm = Langchain::LLM::Mistral.new(api_key: ENV.fetch("MISTRAL_API_KEY"))
    out = llm.chat(messages: [{ role: "user", content: "Rewrite: #{params[:text]}" }])
    halt 200, out.chat_completion
  end
end
