# lexcode-expect: 0
# Video generation that only the team sees, and lookalikes that generate nothing.
require "openai"

# bin/render_teaser.rb: a producer runs it by hand and opens the file.
client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
job = client.videos.create(model: "sora-2", prompt: "Slow pan across a harbor at dawn", seconds: "4")
puts "job #{job.id} #{job.status}"

# lib/tasks/teaser.rake: a draft clip saved to a local folder for review.
namespace :teaser do
  task draft: :environment do
    clip = RubyLLM.animate("A paper boat sailing down a rainy gutter")
    draft_path = "tmp/paper-boat-draft.mp4"
    clip.save(draft_path)
    puts draft_path
  end
end

class VideosController < ApplicationController
  def create
    # A video table with a create method is not the generation API.
    channel = Channel.find(params[:channel_id])
    video = channel.videos.create(title: params[:title], url: params[:url])
    render json: { id: video.id }
  end

  def show
    # Footage a person shot, which the app only plays, is not generated video.
    video = Video.find(params[:id])
    send_file video.file_path, type: "video/mp4"
  end
end

class TrimsController < ApplicationController
  def create
    # Trimming footage a person shot is not generating video.
    out = Rails.root.join("tmp", "trimmed-#{SecureRandom.hex(4)}.mp4").to_s
    system("ffmpeg", "-ss", "3", "-t", "10", "-i", params[:path].to_s, out)
    send_file out, type: "video/mp4"
  end
end

class AnswersController < ApplicationController
  def create
    # A Video record with a prompt column: the app stores a person's recording, no model draws it.
    video = current_user.videos.create(prompt: params[:prompt], file: params[:file])
    render json: video
  end
end
