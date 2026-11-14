# lexcode-expect: 60
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
    r = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    return r
  end

  def self.s1(q)
    r = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    r
  end

  def y1(q)
    r = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    yield r
  end

  def x1(q)
    text = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })["choices"]
    return text
  end

  def self.ys1(q)
    r = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    yield r
  end

  def m2(q)
    r = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    return r
  end

  def self.s2(q)
    r = client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    r
  end

  def y2(q)
    r = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    yield r
  end

  def x2(q)
    text = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })["choices"]
    return text
  end

  def self.ys2(q)
    r = client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    yield r
  end

  def m3(q)
    r = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    return r
  end

  def self.s3(q)
    r = client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    r
  end

  def y3(q)
    r = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    yield r
  end

  def x3(q)
    text = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])["choices"]
    return text
  end

  def self.ys3(q)
    r = client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    yield r
  end

  def m4(q)
    r = @client.responses.create(parameters: { model: "gpt-4.1", input: q })
    return r
  end

  def self.s4(q)
    r = client.responses.create(parameters: { model: "gpt-4.1", input: q })
    r
  end

  def y4(q)
    r = @client.responses.create(parameters: { model: "gpt-4.1", input: q })
    yield r
  end

  def x4(q)
    text = @client.responses.create(parameters: { model: "gpt-4.1", input: q })["choices"]
    return text
  end

  def self.ys4(q)
    r = client.responses.create(parameters: { model: "gpt-4.1", input: q })
    yield r
  end

  def m5(q)
    r = @client.responses.stream(model: "gpt-4.1", input: q)
    return r
  end

  def self.s5(q)
    r = client.responses.stream(model: "gpt-4.1", input: q)
    r
  end

  def y5(q)
    r = @client.responses.stream(model: "gpt-4.1", input: q)
    yield r
  end

  def x5(q)
    text = @client.responses.stream(model: "gpt-4.1", input: q)["choices"]
    return text
  end

  def self.ys5(q)
    r = client.responses.stream(model: "gpt-4.1", input: q)
    yield r
  end

  def m6(q)
    r = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    return r
  end

  def self.s6(q)
    r = claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    r
  end

  def y6(q)
    r = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  end

  def x6(q)
    text = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")["choices"]
    return text
  end

  def self.ys6(q)
    r = claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  end

  def m7(q)
    r = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    return r
  end

  def self.s7(q)
    r = claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    r
  end

  def y7(q)
    r = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  end

  def x7(q)
    text = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")["choices"]
    return text
  end

  def self.ys7(q)
    r = claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  end

  def m8(q)
    r = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    return r
  end

  def self.s8(q)
    r = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    r
  end

  def y8(q)
    r = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  end

  def x8(q)
    text = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])["choices"]
    return text
  end

  def self.ys8(q)
    r = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  end

  def m9(q)
    r = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    return r
  end

  def self.s9(q)
    r = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    r
  end

  def y9(q)
    r = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  end

  def x9(q)
    text = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])["choices"]
    return text
  end

  def self.ys9(q)
    r = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  end

  def m10(q)
    r = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    return r
  end

  def self.s10(q)
    r = client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    r
  end

  def y10(q)
    r = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    yield r
  end

  def x10(q)
    text = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])["choices"]
    return text
  end

  def self.ys10(q)
    r = client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    yield r
  end

  def m11(q)
    r = @client.complete(model: "claude-2", prompt: q)
    return r
  end

  def self.s11(q)
    r = client.complete(model: "claude-2", prompt: q)
    r
  end

  def y11(q)
    r = @client.complete(model: "claude-2", prompt: q)
    yield r
  end

  def x11(q)
    text = @client.complete(model: "claude-2", prompt: q)["choices"]
    return text
  end

  def self.ys11(q)
    r = client.complete(model: "claude-2", prompt: q)
    yield r
  end

  def m12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    return r
  end

  def self.s12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    r
  end

  def y12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    yield r
  end

  def x12(q)
    text = RubyLLM.chat(model: "gpt-4o-mini").ask(q)["choices"]
    return text
  end

  def self.ys12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    yield r
  end
end
