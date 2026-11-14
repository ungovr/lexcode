# lexcode-expect: 16
# One function per source call this rule's sinks list (#13034), in each form that reaches it:
# returned from a method and a class method, and yielded. A sink entry that stops matching drops a
# match here.
require "anthropic"
require "openai"

class Calls
  def initialize
    @client = OpenAI::Client.new
    @claude = Anthropic::Client.new
    @bedrock = Aws::BedrockRuntime::Client.new
    @store = Langchain::Vectorsearch::Qdrant.new(url: "x")
    @gemini = Gemini.new(credentials: {})
  end

  def m1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    return r
  end

  def self.s1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    r
  end

  def y1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    yield r
  end

  def self.ys1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    yield r
  end

  def m2(q)
    r = @store.ask(question: q)
    return r
  end

  def self.s2(q)
    r = store.ask(question: q)
    r
  end

  def y2(q)
    r = @store.ask(question: q)
    yield r
  end

  def self.ys2(q)
    r = store.ask(question: q)
    yield r
  end

  def m3(q)
    r = @gemini.generate_content(contents: { role: "user", parts: { text: q } })
    return r
  end

  def self.s3(q)
    r = gemini.generate_content(contents: { role: "user", parts: { text: q } })
    r
  end

  def y3(q)
    r = @gemini.generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  end

  def self.ys3(q)
    r = gemini.generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  end

  def m4(q)
    r = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    return r
  end

  def self.s4(q)
    r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    r
  end

  def y4(q)
    r = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  end

  def self.ys4(q)
    r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  end
end
