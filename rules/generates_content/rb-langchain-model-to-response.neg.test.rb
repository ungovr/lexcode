# lexcode-expect: 0
# Model calls whose output stays with the team that runs them, and lookalikes that call no model.
require "gemini-ai"
require "langchain"

# bin/risks.rb: an engineer runs it and reads the terminal.
gemini = Gemini.new(
  credentials: { service: "generative-language-api", api_key: ENV.fetch("GOOGLE_API_KEY") },
  options: { model: "gemini-pro" }
)
result = gemini.generate_content({ contents: { role: "user", parts: { text: "List the three biggest risks in this roadmap." } } })
text = result.dig("candidates", 0, "content", "parts", 0, "text")
puts text
File.write("tmp/risks.md", text)
Rails.logger.info("risks: #{text}")

llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
reply = llm.chat(messages: [{ role: "user", content: "Group these support tickets by theme." }])
puts reply.chat_completion
warn reply.chat_completion

# The classification is written to an internal table the team queries.
class TicketTagger
  def tag(ticket)
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    response = llm.chat(messages: [{ role: "user", content: "One word tag for: #{ticket.title}" }])
    InternalTag.create!(ticket_id: ticket.id, tag: response.chat_completion)
  end
end

# Embeddings and a prompt template are not generated content.
class SearchController < ApplicationController
  def index
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    vector = llm.embed(text: params[:q]).embedding
    render json: { hits: Doc.nearest_neighbors(:embedding, vector).limit(10) }
  end

  def vector
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    render json: llm.embed(text: params[:q])
  end

  def embed_page
    gemini = Gemini.new(credentials: { service: "generative-language-api", api_key: ENV.fetch("GOOGLE_API_KEY") })
    embedding = gemini.embed_content({ content: { parts: [{ text: params[:q] }] } })
    render json: { hits: Doc.nearest_neighbors(:embedding, embedding.dig("embedding", "values")) }
  end
end

class PromptsController < ApplicationController
  def show
    template = Langchain::Prompt::PromptTemplate.new(template: "Tell me about {topic}.", input_variables: ["topic"])
    render plain: template.format(topic: params[:topic])
  end
end

# A method named generate_content that calls no model.
class PagesController < ApplicationController
  def show
    page = Page.find(params[:id])
    render html: page.generate_content(:html)
  end
end

class PageBuilder
  def build(page)
    page.generate_content(:html)
  end
end

# Retrieval over a vector store: the hits come from the database, not from a model. The
# Langchain.rb store takes the LLM client only to embed the query.
class KnowledgeController < ApplicationController
  def index
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    store = Langchain::Vectorsearch::Pgvector.new(url: ENV.fetch("DATABASE_URL"), index_name: "docs", llm: llm)
    render json: { hits: store.similarity_search(query: params[:q]) }
  end

  def inline
    hits = Langchain::Vectorsearch::Qdrant.new(
      url: ENV.fetch("QDRANT_URL"),
      api_key: ENV.fetch("QDRANT_API_KEY"),
      index_name: "docs",
      llm: Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    ).similarity_search(query: params[:q])
    render json: { hits: hits }
  end
end

class KnowledgeSearch
  def lookup(query)
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    store = Langchain::Vectorsearch::Pgvector.new(url: ENV.fetch("DATABASE_URL"), index_name: "docs", llm: llm)
    results = store.similarity_search(query: query)
    return results
  end

  def nearest(vector)
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    store = Langchain::Vectorsearch::Chroma.new(url: ENV.fetch("CHROMA_URL"), index_name: "docs", llm: llm)
    found = store.similarity_search_by_vector(embedding: vector)
    found
  end
end

class DocsSearchController < ApplicationController
  before_action :set_llm

  # The view lists stored documents; the model only embeds the query.
  def index
    store = Langchain::Vectorsearch::Pgvector.new(url: ENV.fetch("DATABASE_URL"), index_name: "docs", llm: @llm)
    @hits = store.similarity_search(query: params[:q], k: 5)
  end

  private

  # A client held in an instance variable is not the model's output.
  def set_llm
    @llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"))
    @backup_llm ||= Langchain::LLM::Ollama.new(url: "http://localhost:11434")
  end
end

class ModelInfoController < ApplicationController
  # The client's configured defaults are settings, not output.
  def show
    llm = Langchain::LLM::OpenAI.new(api_key: ENV.fetch("OPENAI_API_KEY"), default_options: { chat_model: "gpt-4o" })
    render json: { model: llm.defaults[:chat_model], temperature: llm.defaults[:temperature] }
  end
end

class ModelSettings
  def chat_model
    llm = Langchain::LLM::Anthropic.new(api_key: ENV.fetch("ANTHROPIC_API_KEY"))
    return llm.defaults[:chat_model]
  end
end
