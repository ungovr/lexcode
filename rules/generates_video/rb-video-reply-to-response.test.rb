# lexcode-expect: 7
require "openai"

class ClipsController < ApplicationController
  # The Sora job started for the visitor is returned to them.
  def create
    client = OpenAI::Client.new(api_key: ENV["OPENAI_API_KEY"])
    job = client.videos.create(model: "sora-2", prompt: params[:prompt], seconds: "4")
    render json: { job_id: job.id, status: job.status }
  end

  # The client built inline, its constructor over several lines.
  def remix
    job = OpenAI::Client.new(
      api_key: ENV["OPENAI_API_KEY"]
    ).videos.create(model: "sora-2", prompt: params[:prompt])
    render json: { job_id: job.id }
  end
end

class AnimationsController < ApplicationController
  # ruby_llm writes the rendered clip to a file, and the file is what the user receives.
  def show
    clip = RubyLLM.animate(params[:prompt])
    path = Rails.root.join("tmp", "clip-#{SecureRandom.hex(6)}.mp4").to_s
    clip.save(path)
    send_file path, type: "video/mp4"
  end
end

class StatusController < ApplicationController
  def show
    client = OpenAI::Client.new
    # The official gem's create takes one params hash, which Ruby also accepts as keywords.
    job = client.videos.create({ model: "sora-2", prompt: "A walk through a market" })
    render plain: job.status
  end
end

class TeaserJob < ApplicationJob
  def perform(campaign_id, prompt)
    client = OpenAI::Client.new
    job = client.videos.create(model: "sora-2", prompt: prompt)
    ActionCable.server.broadcast("campaigns_#{campaign_id}", { job: job.id })
  end
end

# The implicit view shows the job and polls it (app/views/teasers/show.html.erb).
class TeasersController < ApplicationController
  def create
    client = OpenAI::Client.new(api_key: ENV["OPENAI_API_KEY"])
    @job = client.videos.create(model: "sora-2", prompt: params[:prompt], seconds: "4")
  end
end
