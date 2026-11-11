# lexcode-expect: 0
# Image generation that only the team sees, and lookalikes that call no image model.
require "base64"
require "mini_magick"
require "openai"

# bin/make_hero.rb: a designer runs it once and opens the file.
client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
result = client.images.generate(parameters: { model: "gpt-image-1", prompt: "Soft watercolor skyline, no text", size: "1536x1024" })
png = Base64.decode64(result.dig("data", 0, "b64_json"))
File.binwrite("tmp/hero-draft.png", png)
puts "wrote draft, bytes: #{png.bytesize}"

# lib/tasks/art.rake: draft artwork saved to a local folder for review.
namespace :art do
  task drafts: :environment do
    image = RubyLLM.paint("A lighthouse at dusk, flat illustration")
    draft_path = "tmp/lighthouse-draft.png"
    image.save(draft_path)
    puts draft_path
  end
end

class OgCardsController < ApplicationController
  def show
    # An Open Graph card drawn with ImageMagick, no model involved.
    card = MiniMagick::Image.open(Rails.root.join("app/assets/images/og-base.png"))
    card.combine_options { |c| c.draw "text 60,60 '#{params[:title]}'" }
    send_data card.to_blob, type: "image/png", disposition: "inline"
  end
end

class ThumbnailsController < ApplicationController
  def create
    # Resizing a picture a person uploaded is not generating one.
    upload = MiniMagick::Image.read(params[:photo].read)
    upload.resize "256x256"
    send_data upload.to_blob, type: "image/png"
  end
end

class GalleriesController < ApplicationController
  def show
    # Pictures a person made, which the app only reads back, are not generated images.
    gallery = Gallery.find(params[:id])
    render json: { images: gallery.images.map { |image| image.blob.url } }
  end

  def create
    # A gallery's images association has a create method; it is not the Images API.
    image = Gallery.find(params[:id]).images.create(caption: params[:caption])
    render json: image
  end
end

class ProductThumbsController < ApplicationController
  def show
    # An images association with a method named generate: it makes thumbnails, no model is called.
    thumbs = @product.images.generate(size: :thumb)
    render json: thumbs
  end
end
