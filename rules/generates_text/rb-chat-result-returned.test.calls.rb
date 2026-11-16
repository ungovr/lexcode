# lexcode-expect: 156
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

  def w1(q)
    if q
      r = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    end
    return r
  end

  def self.sw1(q)
    if q
      r = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    end
    r
  end

  def yw1(q)
    if q
      r = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    end
    yield r
  end

  def self.ysw1(q)
    if q
      r = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    end
    yield r
  end

  def z1(q)
    r = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    return r
  rescue StandardError
    nil
  end

  def yz1(q)
    r = @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    yield r
  rescue StandardError
    nil
  end

  def self.zs1(q)
    r = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    return r
  rescue StandardError
    nil
  end

  def self.yzs1(q)
    r = client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: q }] })
    yield r
  rescue StandardError
    nil
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

  def w2(q)
    if q
      r = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    end
    return r
  end

  def self.sw2(q)
    if q
      r = client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    end
    r
  end

  def yw2(q)
    if q
      r = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    end
    yield r
  end

  def self.ysw2(q)
    if q
      r = client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    end
    yield r
  end

  def z2(q)
    r = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    return r
  rescue StandardError
    nil
  end

  def yz2(q)
    r = @client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    yield r
  rescue StandardError
    nil
  end

  def self.zs2(q)
    r = client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    return r
  rescue StandardError
    nil
  end

  def self.yzs2(q)
    r = client.completions(parameters: { model: "gpt-3.5-turbo-instruct", prompt: q })
    yield r
  rescue StandardError
    nil
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

  def w3(q)
    if q
      r = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    end
    return r
  end

  def self.sw3(q)
    if q
      r = client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    end
    r
  end

  def yw3(q)
    if q
      r = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    end
    yield r
  end

  def self.ysw3(q)
    if q
      r = client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    end
    yield r
  end

  def z3(q)
    r = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    return r
  rescue StandardError
    nil
  end

  def yz3(q)
    r = @client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    yield r
  rescue StandardError
    nil
  end

  def self.zs3(q)
    r = client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    return r
  rescue StandardError
    nil
  end

  def self.yzs3(q)
    r = client.chat.completions.create(model: "gpt-4o-mini", messages: [{ role: "user", content: q }])
    yield r
  rescue StandardError
    nil
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

  def w4(q)
    if q
      r = @client.responses.create(parameters: { model: "gpt-4.1", input: q })
    end
    return r
  end

  def self.sw4(q)
    if q
      r = client.responses.create(parameters: { model: "gpt-4.1", input: q })
    end
    r
  end

  def yw4(q)
    if q
      r = @client.responses.create(parameters: { model: "gpt-4.1", input: q })
    end
    yield r
  end

  def self.ysw4(q)
    if q
      r = client.responses.create(parameters: { model: "gpt-4.1", input: q })
    end
    yield r
  end

  def z4(q)
    r = @client.responses.create(parameters: { model: "gpt-4.1", input: q })
    return r
  rescue StandardError
    nil
  end

  def yz4(q)
    r = @client.responses.create(parameters: { model: "gpt-4.1", input: q })
    yield r
  rescue StandardError
    nil
  end

  def self.zs4(q)
    r = client.responses.create(parameters: { model: "gpt-4.1", input: q })
    return r
  rescue StandardError
    nil
  end

  def self.yzs4(q)
    r = client.responses.create(parameters: { model: "gpt-4.1", input: q })
    yield r
  rescue StandardError
    nil
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

  def w5(q)
    if q
      r = @client.responses.stream(model: "gpt-4.1", input: q)
    end
    return r
  end

  def self.sw5(q)
    if q
      r = client.responses.stream(model: "gpt-4.1", input: q)
    end
    r
  end

  def yw5(q)
    if q
      r = @client.responses.stream(model: "gpt-4.1", input: q)
    end
    yield r
  end

  def self.ysw5(q)
    if q
      r = client.responses.stream(model: "gpt-4.1", input: q)
    end
    yield r
  end

  def z5(q)
    r = @client.responses.stream(model: "gpt-4.1", input: q)
    return r
  rescue StandardError
    nil
  end

  def yz5(q)
    r = @client.responses.stream(model: "gpt-4.1", input: q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs5(q)
    r = client.responses.stream(model: "gpt-4.1", input: q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs5(q)
    r = client.responses.stream(model: "gpt-4.1", input: q)
    yield r
  rescue StandardError
    nil
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

  def w6(q)
    if q
      r = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    return r
  end

  def self.sw6(q)
    if q
      r = claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    r
  end

  def yw6(q)
    if q
      r = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    yield r
  end

  def self.ysw6(q)
    if q
      r = claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    yield r
  end

  def z6(q)
    r = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    return r
  rescue StandardError
    nil
  end

  def yz6(q)
    r = @claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  rescue StandardError
    nil
  end

  def self.zs6(q)
    r = claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    return r
  rescue StandardError
    nil
  end

  def self.yzs6(q)
    r = claude.messages.create(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  rescue StandardError
    nil
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

  def w7(q)
    if q
      r = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    return r
  end

  def self.sw7(q)
    if q
      r = claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    r
  end

  def yw7(q)
    if q
      r = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    yield r
  end

  def self.ysw7(q)
    if q
      r = claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    end
    yield r
  end

  def z7(q)
    r = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    return r
  rescue StandardError
    nil
  end

  def yz7(q)
    r = @claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  rescue StandardError
    nil
  end

  def self.zs7(q)
    r = claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    return r
  rescue StandardError
    nil
  end

  def self.yzs7(q)
    r = claude.messages.stream(max_tokens: 300, messages: [{ role: "user", content: q }], model: "claude-sonnet-4-5")
    yield r
  rescue StandardError
    nil
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

  def w8(q)
    if q
      r = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    return r
  end

  def self.sw8(q)
    if q
      r = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    r
  end

  def yw8(q)
    if q
      r = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    yield r
  end

  def self.ysw8(q)
    if q
      r = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    yield r
  end

  def z8(q)
    r = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    return r
  rescue StandardError
    nil
  end

  def yz8(q)
    r = @bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  rescue StandardError
    nil
  end

  def self.zs8(q)
    r = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    return r
  rescue StandardError
    nil
  end

  def self.yzs8(q)
    r = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  rescue StandardError
    nil
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

  def w9(q)
    if q
      r = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    return r
  end

  def self.sw9(q)
    if q
      r = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    r
  end

  def yw9(q)
    if q
      r = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    yield r
  end

  def self.ysw9(q)
    if q
      r = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    end
    yield r
  end

  def z9(q)
    r = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    return r
  rescue StandardError
    nil
  end

  def yz9(q)
    r = @bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  rescue StandardError
    nil
  end

  def self.zs9(q)
    r = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    return r
  rescue StandardError
    nil
  end

  def self.yzs9(q)
    r = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: [])
    yield r
  rescue StandardError
    nil
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

  def w10(q)
    if q
      r = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    end
    return r
  end

  def self.sw10(q)
    if q
      r = client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    end
    r
  end

  def yw10(q)
    if q
      r = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    end
    yield r
  end

  def self.ysw10(q)
    if q
      r = client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    end
    yield r
  end

  def z10(q)
    r = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    return r
  rescue StandardError
    nil
  end

  def yz10(q)
    r = @client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    yield r
  rescue StandardError
    nil
  end

  def self.zs10(q)
    r = client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    return r
  rescue StandardError
    nil
  end

  def self.yzs10(q)
    r = client.chat(model: "llama3", messages: [{ role: "user", content: q }])
    yield r
  rescue StandardError
    nil
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

  def w11(q)
    if q
      r = @client.complete(model: "claude-2", prompt: q)
    end
    return r
  end

  def self.sw11(q)
    if q
      r = client.complete(model: "claude-2", prompt: q)
    end
    r
  end

  def yw11(q)
    if q
      r = @client.complete(model: "claude-2", prompt: q)
    end
    yield r
  end

  def self.ysw11(q)
    if q
      r = client.complete(model: "claude-2", prompt: q)
    end
    yield r
  end

  def z11(q)
    r = @client.complete(model: "claude-2", prompt: q)
    return r
  rescue StandardError
    nil
  end

  def yz11(q)
    r = @client.complete(model: "claude-2", prompt: q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs11(q)
    r = client.complete(model: "claude-2", prompt: q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs11(q)
    r = client.complete(model: "claude-2", prompt: q)
    yield r
  rescue StandardError
    nil
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

  def w12(q)
    if q
      r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    end
    return r
  end

  def self.sw12(q)
    if q
      r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    end
    r
  end

  def yw12(q)
    if q
      r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    end
    yield r
  end

  def self.ysw12(q)
    if q
      r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    end
    yield r
  end

  def z12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    return r
  rescue StandardError
    nil
  end

  def yz12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    yield r
  rescue StandardError
    nil
  end

  def self.ys12(q)
    r = RubyLLM.chat(model: "gpt-4o-mini").ask(q)
    yield r
  end
end
