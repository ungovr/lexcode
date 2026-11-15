# lexcode-expect: 52
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

  def x1(q)
    text = Langchain::LLM::OpenAI.new(api_key: q)["choices"]
    return text
  end

  def w1(q)
    if q
      r = Langchain::LLM::OpenAI.new(api_key: q)
    end
    return r
  end

  def self.sw1(q)
    if q
      r = Langchain::LLM::OpenAI.new(api_key: q)
    end
    r
  end

  def yw1(q)
    if q
      r = Langchain::LLM::OpenAI.new(api_key: q)
    end
    yield r
  end

  def self.ysw1(q)
    if q
      r = Langchain::LLM::OpenAI.new(api_key: q)
    end
    yield r
  end

  def z1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    return r
  rescue StandardError
    nil
  end

  def yz1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs1(q)
    r = Langchain::LLM::OpenAI.new(api_key: q)
    yield r
  rescue StandardError
    nil
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

  def x2(q)
    text = @store.ask(question: q)["choices"]
    return text
  end

  def w2(q)
    if q
      r = @store.ask(question: q)
    end
    return r
  end

  def self.sw2(q)
    if q
      r = store.ask(question: q)
    end
    r
  end

  def yw2(q)
    if q
      r = @store.ask(question: q)
    end
    yield r
  end

  def self.ysw2(q)
    if q
      r = store.ask(question: q)
    end
    yield r
  end

  def z2(q)
    r = @store.ask(question: q)
    return r
  rescue StandardError
    nil
  end

  def yz2(q)
    r = @store.ask(question: q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs2(q)
    r = store.ask(question: q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs2(q)
    r = store.ask(question: q)
    yield r
  rescue StandardError
    nil
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

  def x3(q)
    text = @gemini.generate_content(contents: { role: "user", parts: { text: q } })["choices"]
    return text
  end

  def w3(q)
    if q
      r = @gemini.generate_content(contents: { role: "user", parts: { text: q } })
    end
    return r
  end

  def self.sw3(q)
    if q
      r = gemini.generate_content(contents: { role: "user", parts: { text: q } })
    end
    r
  end

  def yw3(q)
    if q
      r = @gemini.generate_content(contents: { role: "user", parts: { text: q } })
    end
    yield r
  end

  def self.ysw3(q)
    if q
      r = gemini.generate_content(contents: { role: "user", parts: { text: q } })
    end
    yield r
  end

  def z3(q)
    r = @gemini.generate_content(contents: { role: "user", parts: { text: q } })
    return r
  rescue StandardError
    nil
  end

  def yz3(q)
    r = @gemini.generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  rescue StandardError
    nil
  end

  def self.zs3(q)
    r = gemini.generate_content(contents: { role: "user", parts: { text: q } })
    return r
  rescue StandardError
    nil
  end

  def self.yzs3(q)
    r = gemini.generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  rescue StandardError
    nil
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

  def x4(q)
    text = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })["choices"]
    return text
  end

  def w4(q)
    if q
      r = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    end
    return r
  end

  def self.sw4(q)
    if q
      r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    end
    r
  end

  def yw4(q)
    if q
      r = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    end
    yield r
  end

  def self.ysw4(q)
    if q
      r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    end
    yield r
  end

  def z4(q)
    r = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    return r
  rescue StandardError
    nil
  end

  def yz4(q)
    r = @gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  rescue StandardError
    nil
  end

  def self.zs4(q)
    r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    return r
  rescue StandardError
    nil
  end

  def self.yzs4(q)
    r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  rescue StandardError
    nil
  end

  def self.ys4(q)
    r = gemini.stream_generate_content(contents: { role: "user", parts: { text: q } })
    yield r
  end
end
