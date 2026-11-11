# lexcode-expect: 14
require "base64"
require "openai"

class AvatarsController < ApplicationController
  # ruby-openai: the generated picture's address is the response.
  def create
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
    result = client.images.generate(parameters: { prompt: "Avatar of #{params[:name]}", size: "1024x1024" })
    render json: { url: result.dig("data", 0, "url") }
  end
end

class PostersController < ApplicationController
  # The picture is decoded and sent back as the response body.
  def show
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { model: "gpt-image-1", prompt: params[:theme] })
    png = Base64.decode64(result.dig("data", 0, "b64_json"))
    send_data png, type: "image/png", disposition: "inline"
  end
end

class RetouchController < ApplicationController
  # The official openai gem: a model edits the visitor's photo.
  def create
    openai = OpenAI::Client.new(api_key: ENV["OPENAI_API_KEY"])
    edited = openai.images.edit(
      prompt: params[:prompt],
      model: "gpt-image-1",
      size: "1024x1024",
      image: OpenAI::FilePart.new(Pathname(params[:photo].path), content_type: "image/jpeg")
    )
    render json: { image: edited.data.first.b64_json }
  end
end

class VariationsController < ApplicationController
  def show
    client = OpenAI::Client.new
    response = client.images.variations(parameters: { image: "tmp/base.png", n: 2 })
    render json: response.dig("data")
  end
end

class WatermarkedController < ApplicationController
  # ruby_llm writes the picture to a file, and the file is what the user receives.
  def show
    image = RubyLLM.paint(params[:prompt])
    path = Rails.root.join("tmp", "paint-#{SecureRandom.hex(6)}.png").to_s
    image.save(path)
    send_file path, type: "image/png"
  end
end

class LogoJob < ApplicationJob
  def perform(brand_id, prompt)
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: prompt })
    url = result.dig("data", 0, "url")
    ActionCable.server.broadcast("brands_#{brand_id}", { logo: url })
  end
end

# The implicit view shows the picture the model drew (app/views/covers/show.html.erb).
class CoversController < ApplicationController
  def show
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: "Book cover for #{params[:title]}", size: "1024x1024" })
    @cover_url = result.dig("data", 0, "url")
  end
end

# The model's picture reaches the person through a partial, the response body, or a Turbo
# broadcast from the record it was saved to.
class SketchPanelsController < ApplicationController
  def show
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:q], size: "1024x1024" })
    render partial: "panels/panel", locals: { value: result.dig("data", 0, "url") }
  end

  def raw
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:q], size: "1024x1024" })
    response.body = result.dig("data", 0, "url")
  end
end

class SketchReplyJob < ApplicationJob
  def perform(thread_id, params)
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:q], size: "1024x1024" })
    message = Message.create!(thread_id: thread_id, role: "assistant", content: result.dig("data", 0, "url"))
    message.broadcast_append_to("thread_#{thread_id}", target: "messages")
  end

  def refresh(record, params)
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:q], size: "1024x1024" })
    record.update(content: result.dig("data", 0, "url"))
    record.broadcast_replace_later_to(record.thread)
  end
end

# Sinatra: a route's value is the response body, and a template the route renders shows its
# instance variables.
class SketchRoutes < Sinatra::Base
  get "/sketchs/:id" do |id|
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:q], size: "1024x1024" })
    result.dig("data", 0, "url")
  end

  post "/sketchs" do
    client = OpenAI::Client.new
    result = client.images.generate(parameters: { prompt: params[:q], size: "1024x1024" })
    @value = result.dig("data", 0, "url")
    erb :sketchs
  end
end
