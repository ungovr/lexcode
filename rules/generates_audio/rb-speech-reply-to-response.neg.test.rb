# lexcode-expect: 0
# Speech synthesis that only the team hears, and audio handling that synthesizes nothing.
require "openai"

# bin/make_greeting.rb: an operator runs it and plays the file.
client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
speech = client.audio.speech(
  parameters: {
    model: "gpt-4o-mini-tts",
    input: "You have reached the front desk. Please leave a message.",
    voice: "alloy"
  }
)
File.binwrite("tmp/greeting.mp3", speech)
puts "greeting written"

# lib/tasks/review_copies.rake: review copies rendered into a local folder.
namespace :audio do
  task review: :environment do
    Prompt.find_each do |prompt|
      narration = RubyLLM.speak(prompt.body)
      review_path = "tmp/review-#{prompt.id}.mp3"
      narration.save(review_path)
      puts review_path
    end
  end
end

class RecordingsController < ApplicationController
  def show
    # A person's own recording that the app only plays is not generated audio.
    recording = Recording.find(params[:id])
    send_file recording.file_path, type: "audio/mpeg"
  end
end

class TranscriptsController < ApplicationController
  def create
    # Transcribing a person's recording turns speech into text; it makes no audio.
    client = OpenAI::Client.new
    response = client.audio.transcribe(parameters: { model: "whisper-1", file: File.open(params[:file].path, "rb") })
    render json: { text: response["text"] }
  end
end

class ClipsController < ApplicationController
  def show
    # Trimming a recording a person made is not generating audio.
    out = Rails.root.join("tmp", "clip-#{SecureRandom.hex(4)}.mp3").to_s
    system("ffmpeg", "-ss", "3", "-t", "10", "-i", Recording.find(params[:id]).file_path, out)
    send_file out, type: "audio/mpeg"
  end
end
