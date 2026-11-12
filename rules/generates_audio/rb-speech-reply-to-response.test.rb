# lexcode-expect: 15
require "aws-sdk-polly"
require "google/cloud/text_to_speech"
require "openai"

class NarrationsController < ApplicationController
  # ruby-openai: the narration the model speaks is the response body.
  def create
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_ACCESS_TOKEN"))
    speech = client.audio.speech(parameters: { model: "gpt-4o-mini-tts", input: params[:text], voice: "alloy" })
    send_data speech, type: "audio/mpeg", disposition: "inline"
  end
end

class ReadAloudController < ApplicationController
  # The official openai gem.
  def show
    openai = OpenAI::Client.new(api_key: ENV["OPENAI_API_KEY"])
    audio = openai.audio.speech.create(input: params[:text], model: "tts-1", voice: "nova")
    send_data audio.read, type: "audio/mpeg"
  end
end

class VoicesController < ApplicationController
  def show
    eleven = ElevenLabs::Client.new(api_key: ENV["ELEVENLABS_API_KEY"])
    audio = eleven.text_to_speech.convert("JBFqnCBsd6RMkjVDRZzb", text: params[:text], model_id: "eleven_multilingual_v2")
    send_data audio, type: "audio/mpeg"
  end
end

class PollyController < ApplicationController
  def show
    polly = Aws::Polly::Client.new(region: "us-east-1")
    out = polly.synthesize_speech(text: params[:text], output_format: "mp3", voice_id: "Joanna", engine: "neural")
    send_data out.audio_stream.read, type: "audio/mpeg"
  end
end

class CloudSpeechController < ApplicationController
  def show
    tts = Google::Cloud::TextToSpeech.text_to_speech
    response = tts.synthesize_speech(
      input: { text: params[:text] },
      voice: { language_code: "en-US", name: "en-US-Neural2-C" },
      audio_config: { audio_encoding: :MP3 }
    )
    render body: response.audio_content, content_type: "audio/mpeg"
  end
end

class SpeakController < ApplicationController
  # ruby_llm writes the speech to a file, and the file is what the user receives.
  def show
    speech = RubyLLM.speak(params[:text])
    path = Rails.root.join("tmp", "speech-#{SecureRandom.hex(6)}.mp3").to_s
    speech.save(path)
    send_file path, type: "audio/mpeg"
  end
end

class AnnouncementJob < ApplicationJob
  def perform(room_id, text)
    client = OpenAI::Client.new
    speech = client.audio.speech(parameters: { model: "tts-1", input: text, voice: "alloy" })
    ActionCable.server.broadcast("rooms_#{room_id}", { audio: Base64.strict_encode64(speech) })
  end
end

# The implicit view plays the narration in an audio tag (app/views/readings/show.html.erb).
class ReadingsController < ApplicationController
  def show
    client = OpenAI::Client.new
    speech = client.audio.speech(parameters: { model: "tts-1", input: params[:text], voice: "alloy" })
    @audio_base64 = Base64.strict_encode64(speech)
  end
end

# The model's speech reaches the person through a partial, the response body, or a Turbo
# broadcast from the record it was saved to.
class VoicePanelsController < ApplicationController
  def show
    client = OpenAI::Client.new
    result = client.audio.speech(parameters: { model: "tts-1", input: params[:q], voice: "alloy" })
    render partial: "panels/panel", locals: { value: Base64.strict_encode64(result) }
  end

  def raw
    client = OpenAI::Client.new
    result = client.audio.speech(parameters: { model: "tts-1", input: params[:q], voice: "alloy" })
    response.body = Base64.strict_encode64(result)
  end
end

class VoiceReplyJob < ApplicationJob
  def perform(thread_id, params)
    client = OpenAI::Client.new
    result = client.audio.speech(parameters: { model: "tts-1", input: params[:q], voice: "alloy" })
    message = Message.create!(thread_id: thread_id, role: "assistant", content: Base64.strict_encode64(result))
    message.broadcast_append_to("thread_#{thread_id}", target: "messages")
  end

  def refresh(record, params)
    client = OpenAI::Client.new
    result = client.audio.speech(parameters: { model: "tts-1", input: params[:q], voice: "alloy" })
    record.update!(content: Base64.strict_encode64(result))
    record.broadcast_replace_later_to(record.thread)
  end
end

# Sinatra: a route's value is the response body, and a template the route renders shows its
# instance variables.
class VoiceRoutes < Sinatra::Base
  get "/voices/:id" do |id|
    client = OpenAI::Client.new
    result = client.audio.speech(parameters: { model: "tts-1", input: params[:q], voice: "alloy" })
    Base64.strict_encode64(result)
  end

  post "/voices" do
    client = OpenAI::Client.new
    result = client.audio.speech(parameters: { model: "tts-1", input: params[:q], voice: "alloy" })
    @value = Base64.strict_encode64(result)
    erb :voices
  end
end
