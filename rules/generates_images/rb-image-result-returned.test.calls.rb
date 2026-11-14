# lexcode-expect: 25
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
    r = @client.images.generate(parameters: { prompt: q })
    return r
  end

  def self.s1(q)
    r = client.images.generate(parameters: { prompt: q })
    r
  end

  def y1(q)
    r = @client.images.generate(parameters: { prompt: q })
    yield r
  end

  def x1(q)
    text = @client.images.generate(parameters: { prompt: q })["choices"]
    return text
  end

  def self.ys1(q)
    r = client.images.generate(parameters: { prompt: q })
    yield r
  end

  def m2(q)
    r = @client.images.edit(parameters: { prompt: q })
    return r
  end

  def self.s2(q)
    r = client.images.edit(parameters: { prompt: q })
    r
  end

  def y2(q)
    r = @client.images.edit(parameters: { prompt: q })
    yield r
  end

  def x2(q)
    text = @client.images.edit(parameters: { prompt: q })["choices"]
    return text
  end

  def self.ys2(q)
    r = client.images.edit(parameters: { prompt: q })
    yield r
  end

  def m3(q)
    r = @client.images.variations(parameters: { image: q })
    return r
  end

  def self.s3(q)
    r = client.images.variations(parameters: { image: q })
    r
  end

  def y3(q)
    r = @client.images.variations(parameters: { image: q })
    yield r
  end

  def x3(q)
    text = @client.images.variations(parameters: { image: q })["choices"]
    return text
  end

  def self.ys3(q)
    r = client.images.variations(parameters: { image: q })
    yield r
  end

  def m4(q)
    r = @client.images.create_variation(image: q)
    return r
  end

  def self.s4(q)
    r = client.images.create_variation(image: q)
    r
  end

  def y4(q)
    r = @client.images.create_variation(image: q)
    yield r
  end

  def x4(q)
    text = @client.images.create_variation(image: q)["choices"]
    return text
  end

  def self.ys4(q)
    r = client.images.create_variation(image: q)
    yield r
  end

  def m5(q)
    r = RubyLLM.paint(q)
    return r
  end

  def self.s5(q)
    r = RubyLLM.paint(q)
    r
  end

  def y5(q)
    r = RubyLLM.paint(q)
    yield r
  end

  def x5(q)
    text = RubyLLM.paint(q)["choices"]
    return text
  end

  def self.ys5(q)
    r = RubyLLM.paint(q)
    yield r
  end
end
