# lexcode-expect: 11
# Speech-to-text calls from Ruby: a Rails controller and jobs that send recorded
# speech to OpenAI, Amazon Transcribe, Google Cloud Speech or AssemblyAI.
require "openai"
require "aws-sdk-transcribeservice"
require "aws-sdk-transcribestreamingservice"
require "google/cloud/speech"
require "assemblyai"

class VoiceNotesController < ApplicationController
  # ruby-openai: the audio resource transcribes in the spoken language.
  def create
    note = current_user.voice_notes.create!(params.require(:voice_note).permit(:audio))
    note.audio.blob.open do |tempfile|
      result = openai.audio.transcribe(
        parameters: { model: "whisper-1", file: File.open(tempfile, "rb"), language: "en" }
      )
      note.update!(body: result["text"])
    end
    redirect_to note
  end

  # ruby-openai again, without parentheses, and its English translation call.
  def translated
    audio = File.open(params[:path], "rb")
    result = openai.audio.translate parameters: { model: "whisper-1", file: audio }
    render json: { text: result["text"] }
  end

  private

  def openai
    @openai ||= OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))
  end
end

# The official openai gem: audio.transcriptions and audio.translations.
class OfficialClientTranscriber
  def transcribe(path)
    client = OpenAI::Client.new
    client.audio.transcriptions.create(model: "gpt-4o-transcribe", file: Pathname(path))
  end

  def translate(path)
    client = OpenAI::Client.new
    client.audio.translations.create(model: "whisper-1", file: Pathname(path))
  end
end

# Amazon Transcribe batch and streaming jobs.
class TranscribeJob < ApplicationJob
  def perform(recording_id)
    recording = Recording.find(recording_id)
    client = Aws::TranscribeService::Client.new(region: "us-east-1")
    client.start_transcription_job(
      transcription_job_name: "recording-#{recording.id}",
      language_code: "en-US",
      media: { media_file_uri: recording.s3_uri }
    )
  end
end

class LiveCaptions
  def open(stream_client)
    stream_client.start_stream_transcription(
      language_code: "en-US", media_encoding: "pcm", media_sample_rate_hertz: 16_000
    )
  end
end

# Google Cloud Speech: the three recognize calls and a request object.
class GoogleSpeechService
  def initialize
    @speech = Google::Cloud::Speech.speech
  end

  def short_clip(content)
    @speech.recognize(config: { language_code: "en-US", encoding: :LINEAR16 }, audio: { content: content })
  end

  def long_clip(uri)
    operation = @speech.long_running_recognize(config: { language_code: "en-US" }, audio: { uri: uri })
    operation.wait_until_done!
    operation.response
  end

  def live(requests)
    @speech.streaming_recognize(requests)
  end

  def request_for(content)
    Google::Cloud::Speech::V1::RecognizeRequest.new(config: { language_code: "en-US" }, audio: { content: content })
  end
end

# AssemblyAI's gem: transcribe and wait, or submit and return.
class AssemblyTranscriber
  def run(url)
    client = AssemblyAI::Client.new(api_key: ENV.fetch("ASSEMBLYAI_API_KEY"))
    client.transcripts.transcribe(audio_url: url).text
  end
end
