# lexcode-expect: 65
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

  def w1(q)
    if q
      r = @client.images.generate(parameters: { prompt: q })
    end
    return r
  end

  def self.sw1(q)
    if q
      r = client.images.generate(parameters: { prompt: q })
    end
    r
  end

  def yw1(q)
    if q
      r = @client.images.generate(parameters: { prompt: q })
    end
    yield r
  end

  def self.ysw1(q)
    if q
      r = client.images.generate(parameters: { prompt: q })
    end
    yield r
  end

  def z1(q)
    r = @client.images.generate(parameters: { prompt: q })
    return r
  rescue StandardError
    nil
  end

  def yz1(q)
    r = @client.images.generate(parameters: { prompt: q })
    yield r
  rescue StandardError
    nil
  end

  def self.zs1(q)
    r = client.images.generate(parameters: { prompt: q })
    return r
  rescue StandardError
    nil
  end

  def self.yzs1(q)
    r = client.images.generate(parameters: { prompt: q })
    yield r
  rescue StandardError
    nil
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

  def w2(q)
    if q
      r = @client.images.edit(parameters: { prompt: q })
    end
    return r
  end

  def self.sw2(q)
    if q
      r = client.images.edit(parameters: { prompt: q })
    end
    r
  end

  def yw2(q)
    if q
      r = @client.images.edit(parameters: { prompt: q })
    end
    yield r
  end

  def self.ysw2(q)
    if q
      r = client.images.edit(parameters: { prompt: q })
    end
    yield r
  end

  def z2(q)
    r = @client.images.edit(parameters: { prompt: q })
    return r
  rescue StandardError
    nil
  end

  def yz2(q)
    r = @client.images.edit(parameters: { prompt: q })
    yield r
  rescue StandardError
    nil
  end

  def self.zs2(q)
    r = client.images.edit(parameters: { prompt: q })
    return r
  rescue StandardError
    nil
  end

  def self.yzs2(q)
    r = client.images.edit(parameters: { prompt: q })
    yield r
  rescue StandardError
    nil
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

  def w3(q)
    if q
      r = @client.images.variations(parameters: { image: q })
    end
    return r
  end

  def self.sw3(q)
    if q
      r = client.images.variations(parameters: { image: q })
    end
    r
  end

  def yw3(q)
    if q
      r = @client.images.variations(parameters: { image: q })
    end
    yield r
  end

  def self.ysw3(q)
    if q
      r = client.images.variations(parameters: { image: q })
    end
    yield r
  end

  def z3(q)
    r = @client.images.variations(parameters: { image: q })
    return r
  rescue StandardError
    nil
  end

  def yz3(q)
    r = @client.images.variations(parameters: { image: q })
    yield r
  rescue StandardError
    nil
  end

  def self.zs3(q)
    r = client.images.variations(parameters: { image: q })
    return r
  rescue StandardError
    nil
  end

  def self.yzs3(q)
    r = client.images.variations(parameters: { image: q })
    yield r
  rescue StandardError
    nil
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

  def w4(q)
    if q
      r = @client.images.create_variation(image: q)
    end
    return r
  end

  def self.sw4(q)
    if q
      r = client.images.create_variation(image: q)
    end
    r
  end

  def yw4(q)
    if q
      r = @client.images.create_variation(image: q)
    end
    yield r
  end

  def self.ysw4(q)
    if q
      r = client.images.create_variation(image: q)
    end
    yield r
  end

  def z4(q)
    r = @client.images.create_variation(image: q)
    return r
  rescue StandardError
    nil
  end

  def yz4(q)
    r = @client.images.create_variation(image: q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs4(q)
    r = client.images.create_variation(image: q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs4(q)
    r = client.images.create_variation(image: q)
    yield r
  rescue StandardError
    nil
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

  def w5(q)
    if q
      r = RubyLLM.paint(q)
    end
    return r
  end

  def self.sw5(q)
    if q
      r = RubyLLM.paint(q)
    end
    r
  end

  def yw5(q)
    if q
      r = RubyLLM.paint(q)
    end
    yield r
  end

  def self.ysw5(q)
    if q
      r = RubyLLM.paint(q)
    end
    yield r
  end

  def z5(q)
    r = RubyLLM.paint(q)
    return r
  rescue StandardError
    nil
  end

  def yz5(q)
    r = RubyLLM.paint(q)
    yield r
  rescue StandardError
    nil
  end

  def self.zs5(q)
    r = RubyLLM.paint(q)
    return r
  rescue StandardError
    nil
  end

  def self.yzs5(q)
    r = RubyLLM.paint(q)
    yield r
  rescue StandardError
    nil
  end

  def self.ys5(q)
    r = RubyLLM.paint(q)
    yield r
  end
end
