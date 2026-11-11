# lexcode-expect: 17
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

# The implicit view shows the outline (app/views/outlines/show.html.erb).
class OutlinesController < ApplicationController
  def show
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    @outline = llm.chat(messages: [{ role: "user", content: "Outline #{params[:topic]}" }]).chat_completion
  end
end

# The model's output reaches the person through a partial, the response body, or a Turbo
# broadcast from the record it was saved to.
class ChainPanelsController < ApplicationController
  def show
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    result = llm.chat(messages: [{ role: "user", content: params[:q] }])
    render partial: "panels/panel", locals: { value: result.chat_completion }
  end

  def raw
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    result = llm.chat(messages: [{ role: "user", content: params[:q] }])
    response.body = result.chat_completion
  end
end

class ChainReplyJob < ApplicationJob
  def perform(thread_id, params)
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    result = llm.chat(messages: [{ role: "user", content: params[:q] }])
    message = Message.create!(thread_id: thread_id, role: "assistant", content: result.chat_completion)
    message.broadcast_append_to("thread_#{thread_id}", target: "messages")
  end

  def refresh(record, params)
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    result = llm.chat(messages: [{ role: "user", content: params[:q] }])
    record.update!(content: result.chat_completion)
    record.broadcast_replace_later_to(record.thread)
  end
end

# Sinatra: a route's value is the response body, and a template the route renders shows its
# instance variables.
class ChainRoutes < Sinatra::Base
  get "/chains/:id" do |id|
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    result = llm.chat(messages: [{ role: "user", content: params[:q] }])
    result.chat_completion
  end

  post "/chains" do
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    result = llm.chat(messages: [{ role: "user", content: params[:q] }])
    @value = result.chat_completion
    erb :chains
  end
end

# Retrieval-augmented generation: the store finds passages and its LLM writes the answer.
class AskDocsController < ApplicationController
  def show
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    store = Langchain::Vectorsearch::Pgvector.new(url: ENV.fetch("DATABASE_URL"), index_name: "docs", llm: llm)
    answer = store.ask(question: params[:q])
    render json: { answer: answer.chat_completion }
  end

  # The store is kept in an instance variable by a callback; the answer is shown by the view.
  def summary
    @answer = @store.ask(question: "Summarize #{params[:topic]}", k: 6).chat_completion
  end
end

class AskStreamController < ApplicationController
  include ActionController::Live

  # The answer streams through a block given to ask.
  def show
    store = Langchain::Vectorsearch::Qdrant.new(
      url: ENV.fetch("QDRANT_URL"),
      api_key: ENV.fetch("QDRANT_API_KEY"),
      index_name: "docs",
      llm: Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    )
    store.ask(question: params[:q]) do |chunk|
      response.stream.write(chunk.dig("choices", 0, "delta", "content"))
    end
  ensure
    response.stream.close
  end
end
