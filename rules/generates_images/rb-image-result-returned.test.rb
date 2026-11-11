# lexcode-expect: 5
require "openai"

# A service object hands the picture to its caller. Where it goes is not visible here, so
# each match is a signal.
class AvatarService
  def initialize(client: OpenAI::Client.new)
    @client = client
  end

  def generate(name)
    result = @client.images.generate(parameters: { prompt: "Avatar of #{name}", size: "1024x1024" })
    return result.dig("data", 0, "url")
  end

  def retouch(photo, prompt)
    result = @client.images.edit(parameters: { prompt: prompt, image: photo })
    url = result.dig("data", 0, "url")
    url
  end

  def self.poster(theme)
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { model: "gpt-image-1", prompt: theme })
    result.dig("data", 0, "b64_json")
  end

  def variant(path)
    result = @client.images.variations(parameters: { image: path, n: 1 })
    { url: result.dig("data", 0, "url") }
    return { url: result.dig("data", 0, "url"), size: "1024x1024" }
  end

  def paint(prompt)
    image = RubyLLM.paint(prompt)
    image.url
  end
end

class AvatarsController < ApplicationController
  # This action answers the request itself, so the evidence rule owns it and the signal
  # rule stays quiet.
  def create
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:name] })
    render json: { url: result.dig("data", 0, "url") }
  end
end
